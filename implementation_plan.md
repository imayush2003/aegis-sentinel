# Aegis Sentinel — Local Deployment Plan

Deploy the Aegis Sentinel project on the local Windows machine. Since Docker is not installed/configured in the environment, we will use the **Manual Unified Production Run (No Docker)** option as outlined in the [pre_deploy_report.md](file:///c:/Users/Ayush/OneDrive/Desktop/Cyber%20Project/pre_deploy_report.md).

## User Review Required

> [!IMPORTANT]
> Since Docker is not available in the current environment, we will run the backend using the local Python virtual environment at `backend/.venv` and serve the pre-built React frontend at `frontend/dist`. 
>
> We will configure the default security credentials for the application:
> - **Username**: `admin`
> - **Password**: `aegis2024`
> 
> If you want to change these, please let us know. Otherwise, we will proceed with these defaults or look for a `.env` file at the root.

## Open Questions

- **Credentials**: Do you want to use the default credentials (`admin` / `aegis2024`) or specify custom ones in a `.env` file?
- **Port**: We verified that port `8000` is currently free. Is it okay to deploy the service on port `8000`?

## Proposed Changes

No changes to the source code are required. We will deploy the application by executing the following steps:

1. **Verify Frontend Build**: Ensure the compiled React assets in [frontend/dist](file:///c:/Users/Ayush/OneDrive/Desktop/Cyber%20Project/frontend/dist) are up to date. (We will run a production build `npm run build` in `frontend` directory first to ensure freshness).
2. **Start Unified Production Service**: Run the FastAPI backend using the Python virtual environment at `backend/.venv/Scripts/python` from the `backend` directory:
   ```powershell
   backend/.venv/Scripts/python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```
   This unified service will automatically detect and serve the React assets on port 8000.

## Verification Plan

### Automated Tests
- None.

### Manual Verification
- We will verify the deployment by querying the `/api/health` endpoint on port `8000` using a PowerShell request (`Invoke-RestMethod`).
- We will run a browser subagent check to verify that the Aegis Sentinel login page loads and is interactive at `http://localhost:8000`.
