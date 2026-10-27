# WordCards

A simple offline app for creating cards to learn foreign languages, you are welcome to download it if you want

Built with React Native and Expo. Runs on Android and iOS and needs no internet connection: decks and progress are stored on the device.

## Features

- **Decks**: create as many decks as you like, each with a name and two languages (plain text, for example Russian and German). The home screen lists them most recently used first.
- **Cards**: each card has a translation, a meaning and an optional example sentence, entered in that order. "Save & add next" makes entering many words quick; the save buttons stay above the keyboard.
- **Learning in both directions**: every card is shown once from the meaning side and once from the translation side, in random order. The two sides of the same word are never shown back to back, unless it is the only word left.
  - Tap a card to flip it (3D animation). Only after flipping can you answer.
  - Swipe right if you knew it, left if not. Cards you didn't know come back a few cards later.
  - The ⋯ button on the card opens it for editing without leaving the session.
- **Daily progress**: a card is _completed_ once both sides were swiped right. Completed cards stay done until the next learning day, which starts at **4:00 AM**. That way a late-night session counts for the evening it started in, and the cards return the next day. "Practice again" restarts a deck at any time.
- **Deck complete**: finishing a deck shows a celebration screen with confetti and stats for the session.
- **Three UI languages**: English, German and Russian. The app starts in the device language if it is one of these, and the switch in the top-right corner of the home screen cycles EN → DE → RU.

## Running during development

```bash
npm install
npx expo start
```

Then use **Expo Go** app on the phone, or press `a` to open it on Android emulator or `i` to open it on IOS
