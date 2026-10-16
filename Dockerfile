# Використовуємо фіксовану версію (не latest) - вимога лабораторної
FROM node:20.12.2-alpine

# Створюємо робочу директорію
WORKDIR /usr/src/app

# Копіюємо конфігураційні файли пакетів
COPY package*.json ./

# Використовуємо npm install замість npm ci, оскільки у нас немає package-lock.json
RUN npm install --omit=dev

# Копіюємо решту коду застосунку
COPY . .

# Змінюємо користувача на не-root (безпека - вимога лабораторної)
USER node

# Відкриваємо порт
EXPOSE 3000

# Команда для запуску
CMD ["npm", "start"]