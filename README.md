# Feedbak BOT
> Бот Telegram для отзывов - будь то проекты, задачи или услуги.

## Требования
- Node.js(18+)
- npm
- Telegram-токен от [@BotFather](https://t.me/BotFather)
- ID администратора и канала

## Установка
1. Клонируйте репозиторий
```
git clone https://github.com/siwagik/feedbackBot.git
cd feedbackBot
```
2. Установите зависимости
```
npm install
```
3. Создайте `.env` в корне проекта
```
BOT_TOKEN=ваш токен от @BotFather
ADMIN_ID=ваш telegram id
CHANNEL_ID=id канала
```

## Запуск
```
npm start
```
В консоле выведется `[BOT] Бот успешно запущен`, если всё ок.

## Лицензия
[MIT](https://github.com/siwagik/feedbackBot?tab=MIT-1-ov-file)
