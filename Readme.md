# Autonomous Claims Fraud Detection System

![Python](https://img.shields.io/badge/Python-3.8+-blue)
![Flask](https://img.shields.io/badge/Flask-2.0+-green)
![FAISS](https://img.shields.io/badge/FAISS-1.7+-orange)
![License](https://img.shields.io/badge/License-MIT-yellow)

A fully autonomous AI system for insurance claims fraud detection using RAG, vector search, and MCP agent orchestration.

## 🚀 Features

- **Autonomous Pipeline**: End-to-end processing without manual intervention
- **Advanced AI Analysis**: Leverages RAG and LLM for fraud detection
- **Vector Similarity Search**: Fast FAISS-based matching against ground truth data
- **MCP Agent Orchestration**: Modular AI agents for scalable workflows
- **Web Dashboard**: User-friendly interface for report review
- **Explainable Reports**: Detailed justifications for all decisions

## 🏗️ Architecture

The system follows this automated workflow:

```mermaid
flowchart TD
    A[📧 Fetch Outlook Emails & PDFs] --> B[📄 Extract Text from Attachments]
    B --> C[🔗 Pair Statements with Treaty Slips]
    C --> D[🗄️ Load Ground Truth Vector Store]
    D --> E[🔍 Semantic Search for Similar Claims]
    E --> F[🤖 Generate Fraud Analysis Report via LLM]
    F --> G[💾 Save Reports (TXT & JSON)]
    G --> H[🌐 Web Dashboard for Review]
    H --> I[⏰ Scheduled Every 4 Hours]
```

## 📦 Installation

1. Clone the repository:
   ```bash
   git clone <repository_url>
   cd <repository_folder>
   ```

2. Create virtual environment:
   ```bash
   python -m venv env
   env\Scripts\activate  # Windows
   source env/bin/activate  # Linux/macOS
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## ⚙️ Configuration

Create a `.env` file in the project root:

```env
MS_USERNAME=your_outlook_username
MS_PASSWORD=your_outlook_password
GOOGLE_API_KEY=your_google_api_key
CLIENT_ID=your_microsoft_app_client_id
CLIENT_SECRET=your_microsoft_app_client_secret
TENANT_ID=your_microsoft_tenant_id
SECRET_KEY=your_flask_secret_key
```

## 🚀 Usage

### Run the Fraud Detection Pipeline

```bash
python src/main.py
```

This starts the autonomous pipeline that runs every 4 hours.

### Launch Web Dashboard

```bash
python app.py
```

Access the dashboard at `http://localhost:5000` for report visualization.

## 📁 Project Structure

```
project-root/
├── src/
│   ├── main.py              # Core fraud detection pipeline
│   ├── mcp_pipeline.py      # MCP agent orchestration
│   ├── outlook_reader.py    # Email and PDF processing
│   ├── vector_store.py      # FAISS vector operations
│   ├── report_generator.py  # LLM report generation
│   └── ...
├── templates/               # Flask HTML templates
├── reports/                 # Generated reports
├── Claims datasets/         # Ground truth Excel files
├── .env                     # Environment variables
└── README.md
```

## 🤖 Modern Concept Protocol (MCP)

MCP is the backbone of autonomous decision-making, enabling AI agents to coordinate seamlessly. Key aspects:

- **Agent Initialization**: Specialized agents for text extraction, vectorization, and analysis
- **Workflow Orchestration**: Sequential execution with dynamic branching
- **Knowledge Integration**: Queries vector store for ground truth matching
- **Decision Logging**: Transparent audit trail for all actions
- **Scalability**: Easy addition of new agents and data sources

## ✨ Key Benefits

- **No Manual Intervention**: Fully automated claim processing
- **High Accuracy**: Semantic matching identifies subtle fraud patterns
- **Scalable Architecture**: Modular design for easy extension
- **Comprehensive Reporting**: Both technical and human-readable outputs
- **Secure & Compliant**: Detailed logging for regulatory requirements

---

*Built with ❤️ for intelligent fraud detection*