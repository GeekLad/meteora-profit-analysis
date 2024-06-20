# Meteora Profit Analysis

Inspired by the work I did on the
[Meteora Discord Bot](https://github.com/GeekLad/meteora-discord-bot),
I decided to develop a web application to look at the total profitability of
a wallet. This tool depends heaviliy on the
[Meteora Web API](https://dlmm-api.meteora.ag/swagger-ui/) to obtain data on
positions as well as the deposits & withdrawals made on those positions.

## Try it Live on GitHub Pages

https://geeklad.github.io/meteora-profit-analysis/

## Technologies Used

- [Next.js 14](https://nextjs.org/docs/getting-started)
- [NextUI](https://nextui.org)
- [Tailwind CSS](https://tailwindcss.com)
- [Tailwind Variants](https://tailwind-variants.org)
- [TypeScript](https://www.typescriptlang.org)
- [Framer Motion](https://www.framer.com/motion)
- [next-themes](https://github.com/pacocoursey/next-themes)

## How to Use

### Install Bun

Install bun using the instructions at https://bun.sh/docs/installation.

### Install dependencies

Install using bun:

```bash
bun install
```

### Run the development server

```bash
bun run dev
```

### Build static html output that can be hosted

The app can be built to be hosted on 100% static HTML pages, which will be
output to `/out`. To build the project:

```bash
bun run build
```
