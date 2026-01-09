# How to Open and Run the Website

This guide will help you start the **RepHeaven** website locally on your computer.

## Prerequisites
- **Node.js**: Ensure Node.js is installed.
- **Terminal**: You will need to use the terminal (Command Prompt, PowerShell, or macOS Terminal).

## Steps to Run

1.  **Open Terminal**
    - Navigate to the project folder:
      ```bash
      cd /Users/29cheusr/.gemini/antigravity/scratch/sebyyreps_spreadsheet_draft1
      ```

2.  **Install Dependencies** (If you haven't already)
    - Run the following command to install all necessary libraries:
      ```bash
      npm install
      ```

3.  **Start the Development Server**
    - Run this command to start the website:
      ```bash
      npm run dev
      ```

4.  **Open in Browser**
    - Once the server is running, you will see a local address (usually `http://localhost:5173/`).
    - Open your web browser (Chrome, Safari, etc.) and go to:
      [http://localhost:5173](http://localhost:5173)

## Troubleshooting
- **Port already in use**: If `5173` is taken, Vite will switch to `5174` or higher. Check the terminal output.
- **Errors**: detailed errors will appear in the terminal window.
