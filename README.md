# Pinot Table & Schema Generator

A client-side React application that provides a step-by-step wizard for generating valid Pinot table and schema JSON configurations. Users configure table settings through a form-based UI and export the generated JSON for use with the Pinot API.

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173` (or the port shown in the terminal).

### Testing

Run the test suite:

```bash
npm test
```

To run tests once (CI mode):

```bash
npx vitest run
```

### Build

```bash
npm run build
```

## Features

- **Table Configuration:** Table name and type (OFFLINE/REALTIME), segments config, field configs, ingestion config, upsert and dedup configs
- **Schema Configuration:** Dimension, metric, DateTime, and complex field specs
- **Export:** Copy to clipboard or download as JSON files
