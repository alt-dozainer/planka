const fs = require('fs');
const { execSync } = require('child_process');
const OpenAI = require('openai');

const Errors = {
  NOT_CONFIGURED: {
    notConfigured: 'OpenAI API key is not configured',
  },
  BOARD_NOT_FOUND: {
    boardNotFound: 'Board not found',
  },
  NOT_ENOUGH_RIGHTS: {
    notEnoughRights: 'Not enough rights',
  },
  PROCESSING_FAILED: {
    processingFailed: 'Voice command processing failed',
  },
};

module.exports = {
  inputs: {
    boardId: {
      type: 'string',
      regex: /^[0-9]+$/,
      required: true,
    },
  },

  exits: {
    notConfigured: {
      responseType: 'serverError',
    },
    boardNotFound: {
      responseType: 'notFound',
    },
    notEnoughRights: {
      responseType: 'forbidden',
    },
    processingFailed: {
      responseType: 'serverError',
    },
  },

  async fn(inputs) {
    const { currentUser } = this.req;

    if (!sails.config.custom.openaiApiKey) {
      throw Errors.NOT_CONFIGURED;
    }

    const board = await Board.findOne(inputs.boardId);
    if (!board) {
      throw Errors.BOARD_NOT_FOUND;
    }

    const boardMembership = await BoardMembership.findOne({
      boardId: board.id,
      userId: currentUser.id,
    });

    if (!boardMembership) {
      throw Errors.BOARD_NOT_FOUND;
    }

    const uploadedFile = await new Promise((resolve, reject) => {
      this.req.file('audio').upload(
        {
          maxBytes: 25 * 1024 * 1024,
        },
        (err, files) => {
          if (err) return reject(err);
          if (!files || files.length === 0) return reject(new Error('No audio file uploaded'));
          return resolve(files[0]);
        },
      );
    });

    // Rename uploaded file with .webm extension for Whisper
    const renamedPath = `${uploadedFile.fd}.webm`;
    try {
      fs.renameSync(uploadedFile.fd, renamedPath);
    } catch (e) {
      sails.log.error('Failed to rename uploaded file:', e.message);
      throw Errors.PROCESSING_FAILED;
    }

    // Use curl for Whisper transcription (node-fetch has ECONNRESET issues with multipart uploads on Node 18)
    let transcript;
    try {
      const curlPath = renamedPath.replace(/\\/g, '/');
      const result = execSync(
        `curl -s -X POST "https://api.openai.com/v1/audio/transcriptions" ` +
          `-H "Authorization: Bearer ${sails.config.custom.openaiApiKey}" ` +
          `-F "model=whisper-1" ` +
          `-F "file=@${curlPath}"`,
        { timeout: 60000, encoding: 'utf-8' },
      );
      const parsed = JSON.parse(result);
      if (parsed.error) {
        throw new Error(parsed.error.message);
      }
      transcript = parsed.text;
    } catch (error) {
      sails.log.error('Whisper transcription failed:', error.message || error);
      throw Errors.PROCESSING_FAILED;
    } finally {
      try {
        fs.unlinkSync(renamedPath);
      } catch (e) {
        // ignore cleanup errors
      }
    }

    if (!transcript || !transcript.trim()) {
      return {
        transcript: '',
        actions: [],
      };
    }

    // Fetch board context for GPT
    const lists = await List.find({ boardId: board.id }).sort('position ASC');
    const labels = await Label.find({ boardId: board.id }).sort('position ASC');
    const memberships = await BoardMembership.find({ boardId: board.id });
    const userIds = memberships.map((m) => m.userId);
    const users = await User.find({ id: userIds });
    const cards = await Card.find({ boardId: board.id }).sort('position ASC');
    const cardIds = cards.map((c) => c.id);
    const tasks =
      cardIds.length > 0 ? await Task.find({ cardId: cardIds }).sort('position ASC') : [];

    const parseDescription = (desc) => {
      if (!desc) return {};
      try {
        return JSON.parse(desc);
      } catch (e) {
        return { description: desc };
      }
    };

    const boardContext = {
      lists: lists.map((l) => ({ id: l.id, name: l.name })),
      labels: labels.map((l) => ({ id: l.id, name: l.name, color: l.color })),
      members: users.map((u) => ({ id: u.id, name: u.name, username: u.username })),
      cards: cards.map((c) => {
        const parsed = parseDescription(c.description);
        return {
          id: c.id,
          name: c.name,
          listId: c.listId,
          dueDate: c.dueDate || null,
          clientName: parsed.clientName || null,
          phoneNo: parsed.phoneNo || null,
          resourceId: parsed.resourceId || null,
          description: parsed.description || null,
          isJsonDescription: c.description ? c.description.startsWith('{') : false,
          tasks: tasks
            .filter((t) => t.cardId === c.id)
            .map((t) => ({ id: t.id, name: t.name, isCompleted: t.isCompleted })),
        };
      }),
    };

    const today = new Date().toISOString().split('T')[0];
    const model = sails.config.custom.openaiModel || 'gpt-4o-mini';

    const openai = new OpenAI({
      apiKey: sails.config.custom.openaiApiKey,
    });

    let actionPlan;
    try {
      const chatCompletion = await openai.chat.completions.create({
        model,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `You are a project management assistant for a Kanban board app called Planka, used by an auto service shop (car repair/maintenance).
Parse the user's voice command into structured actions. Today's date is ${today}.
The user speaks Romanian. Interpret commands accordingly.

IMPORTANT: Voice commands frequently contain car brand names and models (e.g. BMW X5, Audi Q7, Dacia Logan, Mercedes C200, VW Golf, Opel Astra, Toyota Corolla, Skoda Octavia, Ford Focus, Renault Megane, Hyundai Tucson, etc.). Whisper may misspell or misinterpret these. Always try to correct car names to their proper spelling. Card titles will typically be car names/models.

Resource map (services offered by the auto shop):
- resourceId 1: "Folie/PPF/Colantări/Diverse" — includes: PPF (paint protection film), folie, colantare, colantări, diverse, lunetă, plafon, capotă, aripi, bară, praguri, oglinzi, ornamente
- resourceId 2: "Faruri" — includes: faruri, folie faruri, protecție faruri, restaurare faruri
- resourceId 3: "Detailing" — includes: detailing, curățare, polish, ceruire, curățare interior, curățare jante, curățare tapițerie

When tasks are mentioned, infer the resourceId from the FIRST task based on the resource map above. For example:
- "PPF lunetă" → resourceId = 1 (PPF is in resource 1)
- "folie faruri" → resourceId = 2 (faruri-related)
- "curățare jante" → resourceId = 3 (detailing)
- "PPF lunetă, folie faruri, curățare jante" → resourceId = 1 (first task is PPF)

IMPORTANT: clientName, phoneNo, and resourceId are SEPARATE action fields (not part of the description field).
The "description" field in actions is ONLY for free-text notes. Never put JSON in the description field.

Custom keyword shortcuts:
- "programează [title]" or "programare [title]" → createCard with the given title in the first list (these mean "schedule" an appointment)
- "programează [title] pe [date]" → createCard with dueDate. Examples:
  - "programează Dacia Logan pe mâine" → dueDate = tomorrow
  - "programează Dacia Logan pe poimâine" → dueDate = day after tomorrow
  - "programează Dacia Logan peste 3 zile" → dueDate = today + 3 days
  - "programează Dacia Logan pe 20 martie" → dueDate = March 20th (current or next year)
  - "programează Dacia Logan pe vineri" → dueDate = next Friday
  - "programează Dacia Logan săptămâna viitoare" → dueDate = next Monday
- "programează [title] pe numele [clientName]" or "programează [title] client [clientName]" → createCard with clientName in description JSON
- "programează [title] la numărul [phoneNo]" or "programează [title] telefon [phoneNo]" → createCard with phoneNo in description JSON
- "la [card] clientul este [clientName]" or "la [card] pe numele [clientName]" → updateCard with clientName
- "la [card] telefonul este [phoneNo]" or "la [card] numărul este [phoneNo]" → updateCard with phoneNo
- "la [card] de notat [text]" or "la [card] notează [text]" or "la [card] descriere [text]" → updateCard with description (free-text note)
- "adaugă card/cardul [title]" or "creează card/cardul [title]" → createCard
- "adaugă pe [member] la [card]" → addMemberToCard
- "mută [card] în/la [list]" → moveCard (move card to a different list)
- "mută [card] la ora [time]" or "schimbă ora la [card] la [time]" → updateCard with dueDate time change (keep existing date, change only the time)
- "reprogramează [card] pe [date]" or "reprogramează [card] pe [date] la [time]" → updateCard with new dueDate (and optionally time)
- "bifează [task]" or "bifează [task] de la/la [card]" → completeTask (mark task as completed)
- "debifează [task]" or "debifează [task] de la/la [card]" → uncompleteTask (mark task as not completed)
- "șterge [card]" → deleteCard

Romanian date keywords reference:
- "azi" = today, "mâine" = tomorrow, "poimâine" = day after tomorrow
- "peste X zile" = in X days, "peste o săptămână" = in 1 week
- "luni/marți/miercuri/joi/vineri/sâmbătă/duminică" = Monday-Sunday (use the NEXT occurrence)
- "pe [day] [month]" = specific date (e.g. "pe 20 martie" = March 20)
- Romanian months: ianuarie, februarie, martie, aprilie, mai, iunie, iulie, august, septembrie, octombrie, noiembrie, decembrie
- "la ora [H]" or "la [H]" = at hour H (e.g. "la ora 14" = 14:00, "la 3" = 15:00 if PM context or 03:00)
- "dimineață" = morning (assume 09:00), "prânz" = noon (12:00), "după-amiază" = afternoon (14:00), "seară" = evening (18:00)
- Time is in 24h format. Hours typically fall in the business hours: 08:00 to 18:00. If someone says "la 3" in a work context, assume 15:00. For "la ora 10", use 10:00.
Always output dates in format: YYYY-MM-DDTHH:mm:ss (NO timezone suffix, NO "Z"). Treat all times as local time. If no time specified, default to T09:00:00.

Available board context:
${JSON.stringify(boardContext, null, 2)}

Output a JSON object with this structure:
{
  "actions": [
    {
      "type": "<actionType>",
      ...action-specific fields
    }
  ]
}

Supported action types:

1. "createCard" - Create a new card
   Fields: listName (string), name (string), description (string|null), dueDate ("YYYY-MM-DDTHH:mm:ss"|null), memberNames (string[]), labelNames (string[]), tasks (string[]), clientName (string|null), phoneNo (string|null), resourceId (number|null)
   - listName: match to closest list name from context. If not specified, use the first list.
   - memberNames: match spoken names to closest member names from context.
   - labelNames: match spoken labels to closest label names from context.
   - dueDate: convert relative dates to full ISO 8601 datetime. If no time specified, default to T09:00:00.
   - tasks: extract subtasks or checklist items mentioned.
   - clientName: client name if mentioned.
   - phoneNo: phone number if mentioned.
   - resourceId: inferred from the first task/service mentioned using the resource map. If no tasks, null.
   - description, dueDate, memberNames, labelNames, tasks, clientName, phoneNo, resourceId are all optional.

2. "addMemberToCard" - Add a member to an existing card
   Fields: cardName (string), memberNames (string[])
   - cardName: match to closest card name from context.
   - memberNames: match to closest member names from context.

3. "removeMemberFromCard" - Remove a member from an existing card
   Fields: cardName (string), memberNames (string[])

4. "addLabelToCard" - Add a label to an existing card
   Fields: cardName (string), labelNames (string[])
   - labelNames: match to closest label names from context.

5. "removeLabelFromCard" - Remove a label from an existing card
   Fields: cardName (string), labelNames (string[])

6. "updateCard" - Update an existing card's fields (description, dueDate, name, clientName, phoneNo, resourceId)
   Fields: cardName (string), name (string|null), description (string|null), dueDate ("YYYY-MM-DDTHH:mm:ss"|null), clientName (string|null), phoneNo (string|null), resourceId (number|null)
   - Only include fields that should be changed.
   - dueDate supports full ISO 8601 datetime. If only time is changed, keep the existing date from the card context and change only the time portion.
   - If no time is specified, default to T09:00:00.
   - clientName, phoneNo, resourceId: update specific fields in the card's JSON description. Only include if explicitly mentioned.

7. "moveCard" - Move a card to a different list
   Fields: cardName (string), listName (string)

8. "addTaskToCard" - Add tasks/checklist items to an existing card
   Fields: cardName (string), tasks (string[])

9. "completeTask" - Mark a task as completed
   Fields: cardName (string|null), taskName (string)
   - taskName: match to closest task name from the card's tasks in context.
   - cardName: if specified, look for task only in that card. If null, search all cards for a matching task.

10. "uncompleteTask" - Mark a task as not completed
    Fields: cardName (string|null), taskName (string)
    - Same matching rules as completeTask.

11. "deleteCard" - Delete a card
    Fields: cardName (string)

If the command doesn't make sense for this board, return {"actions": []}.
Always return valid JSON.`,
          },
          {
            role: 'user',
            content: transcript,
          },
        ],
      });

      actionPlan = JSON.parse(chatCompletion.choices[0].message.content);
    } catch (error) {
      sails.log.error('GPT parsing failed:', error.message || error);
      throw Errors.PROCESSING_FAILED;
    }

    return {
      transcript,
      actions: actionPlan.actions || [],
      boardContext,
    };
  },
};
