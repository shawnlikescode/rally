# Rally
---

I want a better waking experience than my alarm. I think something like a hotel wake-up call that I can't ignore would be nice.

## Features

### I want to finish:
- [ ] Implement basic wake-up call scheduling
- [ ] Integrate text-to-speech/audio playback for voice calls
- [ ] Build a basic user dashboard

### If I don't get bored features:
- [ ] Alert actions (just options probably won't even do any of them)
    - [ ] Interactive response
    - [ ] Integrate with smart devices to register physical movement as alertness
    - [ ] Post-call tasks or puzzles
    - [ ] Positive reinforcement (internet rewards, streaks)
- [ ] Add calendar integration
- [ ] Allow for more customizable wake-up messages (weather, traffic, news)
- [ ] Expand dashboard


```text
apps
  └─ next.js
      ├─ Next.js 14
      ├─ Clerk
      ├─ React 18
      ├─ Tailwind CSS
      └─ E2E Typesafe API Server & Client
packages
  ├─ api
  |   └─ tRPC v11 router definition
  ├─ db
  |   └─ Typesafe db calls using Drizzle & Supabase
  └─ ui
      └─ Start of a UI package for the webapp using shadcn-ui
tooling
  ├─ eslint
  |   └─ shared, fine-grained, eslint presets
  ├─ prettier
  |   └─ shared prettier configuration
  ├─ tailwind
  |   └─ shared tailwind configuration
  └─ typescript
      └─ shared tsconfig you can extend from
```

## Quick Start

To get it running, follow the steps below:

### 1. Setup dependencies

```bash
# Install dependencies
pnpm i

# Configure environment variables
# There is an `.env.example` in the root directory you can use for reference
cp .env.example .env

# Push the Drizzle schema to the database
pnpm db:push
```

### 4a. When it's time to add a new UI component

Run the `ui-add` script to add a new UI component using the interactive `shadcn/ui` CLI:

```bash
pnpm ui-add
```

When the component(s) has been installed, you should be good to go and start using it in your app.

### 4b. When it's time to add a new package

To add a new package, simply run `pnpm turbo gen init` in the monorepo root. This will prompt you for a package name as well as if you want to install any dependencies to the new package (of course you can also do this yourself later).

The generator sets up the `package.json`, `tsconfig.json` and a `index.ts`, as well as configures all the necessary configurations for tooling around your package such as formatting, linting and typechecking. When the package is created, you're ready to go build out the package.

## Deployment

### Next.js

#### Deploy to Vercel

Let's deploy the Next.js application to [Vercel](https://vercel.com). If you've never deployed a Turborepo app there, don't worry, the steps are quite straightforward. You can also read the [official Turborepo guide](https://vercel.com/docs/concepts/monorepos/turborepo) on deploying to Vercel.

1. Create a new project on Vercel, select the `apps/nextjs` folder as the root directory. Vercel's zero-config system should handle all configurations for you.

2. Add your `DATABASE_URL` environment variable.

3. Done! Your app should successfully deploy. Assign your domain and use that instead of `localhost` for the `url` in the Expo app so that your Expo app can communicate with your backend when you are not in development.


#### SHOUTOUT
I started this project by tweaking [create-t3-turbo](https://github.com/t3-oss/create-t3-turbo).

I've removed expo. I meant readd it in the future but for now I don't care about a mobile app. I also switch from next-auth to Clerk.
