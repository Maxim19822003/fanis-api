# 🤖 Фанис — Backend

Node.js + Express + PostgreSQL бэкенд для PWA приложения.

---

## 📦 Файлы

| Файл | Назначение |
|------|-----------|
| `server.js` | Главный сервер |
| `package.json` | Зависимости |
| `database.sql` | Структура базы данных |
| `.env.example` | Шаблон переменных окружения |

---

## 🚀 Деплой на Render

### Шаг 1: Создать PostgreSQL базу
1. На Render нажмите **New +** → **PostgreSQL**
2. Название: `fanis-db`
3. Регион: ближайший к вам
4. Нажмите **Create Database**
5. Скопируйте **Internal Database URL**

### Шаг 2: Создать Web Service
1. **New +** → **Web Service**
2. Подключите репозиторий (или загрузите файлы)
3. Настройки:
   - **Name**: `fanis-api`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
4. Добавьте переменную окружения:
   - `DATABASE_URL` = скопированный URL из шага 1
   - `NODE_ENV` = `production`
5. Нажмите **Create Web Service**

### Шаг 3: Инициализировать базу
1. В Render откройте ваш PostgreSQL
2. Нажмите **Shell** (или **PSQL Console**)
3. Выполните:
   ```sql
   \i database.sql
   ```
   Или скопируйте содержимое `database.sql` и выполните.

### Шаг 4: Проверить
Откройте в браузере:
```
https://fanis-api.onrender.com/api/health
```
Должно вернуть: `{"status":"ok"}`

---

## 🔗 API Endpoints

### Поломки
- `GET /api/breakdowns` — активные поломки
- `GET /api/breakdowns/all` — все поломки (админ)
- `POST /api/breakdowns` — создать
- `PUT /api/breakdowns/:id` — обновить
- `DELETE /api/breakdowns/:id` — удалить

### Коды ошибок
- `GET /api/errors/:system` — ошибки по системе
- `GET /api/errors/all` — все ошибки (админ)
- `POST /api/errors` — создать
- `PUT /api/errors/:id` — обновить
- `DELETE /api/errors/:id` — удалить

### Контакты
- `GET /api/contacts` — все контакты
- `PUT /api/contacts/:name` — обновить

### Админ
- `POST /api/admin/check` — проверить пароль
- `POST /api/admin/change-password` — сменить пароль
- `POST /api/admin/reset-password` — сбросить на стандартный

---

## 📱 Обновить PWA

В `app.js` замените:
```javascript
const API_URL = 'https://fanis-api.onrender.com';
```

На ваш реальный URL бэкенда.
