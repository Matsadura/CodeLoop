# CodeLoop 🔄

![image](https://github.com/user-attachments/assets/3868c37e-9ce7-4e24-8b5f-e11ed98eaf98)


> A community-driven coding platform where everyone is both a student and an educator.

[![Made with React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Flask](https://img.shields.io/badge/Flask-000000?style=flat&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)

## 🌟 Overview

CodeLoop revolutionizes coding education by creating a unique environment where the traditional roles of students and educators blur. Every user contributes to the community's growth by both learning and teaching, creating a continuous loop of knowledge sharing.

## ✨ Features

- **Interactive Code Editor**: Write, compile, and execute code in real-time
- **Peer Learning**: Share your knowledge and learn from others
- **Community Challenges**: Solve and create coding challenges
- **Multi-language Support**: Practice in various programming languages
- **Real-time Feedback**: Get immediate feedback on your code

## 🛠️ Tech Stack

- **Frontend**: React with Tailwind CSS for modern, responsive UI
- **Backend**: Flask (Python) for robust API services
- **Database**: MySQL with SQLAlchemy ORM
- **Code Execution**: Judge0 API integration
- **Authentication**: JWT-based user authentication

## 🚀 Getting Started

### Prerequisites

- Python 3.8+
- Docker

### Installation

1. Clone the repository
```bash
git clone https://github.com/Matsadura/CodeLoop.git
cd CodeLoop
```

2. Set up the Judge0
```bash
cd server/judge0
docker compose up -d db redis
sleep 10
docker compose up -d
```

3. Set up the backend
```bash
cd server
python3 -m venv flask
source flask/bin/activate
pip3 install flask==2.1.0 werkzeug==2.1.1 flask-cors==4.0.1 sqlalchemy==1.4.22 mysqlclient==2.2.4 python-dotenv flask-jwt-extended requests
```

4. Configure environment variables
```bash
export CODE_DB_HOST=0.0.0.0
export CODE_DB_NAME=CODE_DB
export CODE_DB_USER=CODE_USER
export CODE_DB_PASSWORD=CODE_PASSWORD

# Edit .env with your configuration
vim server/api/.env

CODE_API_HOST=0.0.0.0
CODE_API_PORT=5000
JWT_SECRET_KEY=your-key-here
```

6. Start the application
```bash
# In the parent directory
docker compose up -d mysql client

# In server directory
python3 -m api.app
```


## 🤝 Contributing

We welcome contributions!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request


## 🙏 Acknowledgments

- Judge0 API for code execution

---

Made with ❤️ by the CodeLoop Team
