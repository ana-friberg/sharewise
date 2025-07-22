# Expenses App

## Description

This project is a Node.js/TypeScript application for managing expenses, featuring a RESTful API that connects to a MongoDB Atlas database.  
It includes robust connection handling with caching and health checks, and is designed to run both locally and in production environments such as Vercel.  
The app allows users to store, retrieve, and manage expense data efficiently and securely.

---

## Features

- RESTful API for managing expenses
- MongoDB Atlas integration with connection pooling and caching
- Environment-based configuration
- Production-ready error handling

---

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm or yarn
- A MongoDB Atlas cluster (or compatible MongoDB instance)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd expenses-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure environment variables:**

   Create a `.env.local` file in the root directory and add your MongoDB connection string:
   ```
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority
   ```

### Running Locally

```bash
npm run dev
# or
yarn dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

---

## Deployment

This app is ready for deployment on [Vercel](https://vercel.com/):

1. Push your code to GitHub/GitLab/Bitbucket.
2. Import the project into Vercel.
3. Set the `MONGODB_URI` environment variable in your Vercel project settings.
4. Deploy!

---

## Troubleshooting

- **Cannot connect to MongoDB Atlas locally:**  
  - Make sure your IP is whitelisted in Atlas Network Access (or use `0.0.0.0/0` for open access).
  - If using a VPN, try disconnecting it—some VPNs block database connections.
  - Ensure your `MONGODB_URI` is correct and uses the `mongodb+srv://` format.

- **Production works but local does not:**  
  - Check your local network/firewall settings.
  - Try switching DNS to Google (8.8.8.8) or Cloudflare (1.1.1.1).

---

## Project Structure

```
expenses-app/
├── app/                # Next.js app directory (API routes, pages, etc.)
├── lib/
│   └── mongodb.ts      # MongoDB connection logic
├── .env.local          # Local environment variables (not committed)
├── package.json
└── README.md
```

---

## License

MIT

---

## URL

[Sharewise Website](https://sharewise-app.vercel.app/)

---

## Contact

For questions or support, please feel free to contact me.