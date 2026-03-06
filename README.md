# Aircraft Maintenance Dashboard

This is a code bundle for Aircraft Maintenance Dashboard. The original project is available at https://www.figma.com/design/f7hvx6jSFsWnS6XfqFZeFA/Aircraft-Maintenance-Dashboard.

## Running the code

Run `npm i` to install the dependencies.

Run `npm run dev` to start the development server.

## Fixing `react/jsx-dev-runtime` import errors

If Vite shows an error like:

`Failed to resolve import "react/jsx-dev-runtime" from "src/main.tsx"`

it usually means your local install is incomplete/corrupted. Do a clean reinstall using the command set that matches your shell.

### macOS / Linux (bash, zsh)

```bash
# from project root
rm -rf node_modules package-lock.json
npm cache verify
npm install
npm run dev
```

### Windows Command Prompt (cmd.exe)

```bat
:: from project root
rmdir /s /q node_modules
del /f /q package-lock.json
npm cache verify
npm install
npm run dev
```

### Windows PowerShell

```powershell
# from project root
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json -ErrorAction SilentlyContinue
npm cache verify
npm install
npm run dev
```
