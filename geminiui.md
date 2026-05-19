The Axia chat behavior is working now. Good.

Next UI adjustment: make the main Axia chat/composer experience larger and more spacious.

You are working in:

/Users/djjordan/projects/tradora-autoreel-ui

Do not change engine behavior.
Do not redesign the app.
Do not break chat or video generation.

Current issue:
The Axia chat panel, conversation area, and composer feel too compressed. The UI should feel more like a full AI workspace, with the conversation and message box taking more of the screen.

Goal:
Make the main Axia area bigger, wider, and easier to use.

Please adjust the layout so:

1. Main Axia container
- Increase max-width significantly.
- Use more horizontal screen space on desktop.
- Keep it centered.
- Reduce unnecessary top/bottom compression.
- Keep responsive behavior for smaller screens.

2. Conversation panel
- Make the conversation area taller.
- Give it enough height to feel like a real chat workspace.
- Allow scrolling inside the conversation area if messages exceed height.
- Keep user and Axia messages readable.

3. Composer/message box
- Make the textarea taller and more comfortable.
- Keep placeholder visible.
- Keep Send to Axia button aligned cleanly.
- Keep attachment area close to the composer.
- Do not make the user scroll too much just to send a message.

4. Typography/spacing
- Increase readability slightly.
- Add more breathing room between chat messages.
- Keep the premium dark/cyan style.
- Do not make the UI look bulky or messy.

5. Preserve behavior
Do not change:
- regular chat mode with /v1/chat
- image/video mode with /v1/jobs
- Enter send behavior
- Shift+Enter newline behavior
- attachment behavior
- Engine Monitor behavior
- settings behavior

After changes, run:

npm run build

Return:
1. Files changed
2. What layout sizes were adjusted
3. How the chat/composer is larger now
4. Build result
5. Remaining risks