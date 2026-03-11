require('dotenv').config();
const Application = require('./Application');
const app = new Application();

const PORT = process.env.PORT || 3000;

app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
});

let gymMembers = [
    {
        id: 1,
        fullName: "Тимур Гачков",
        age: 19,
        hasActiveSubscription: true,
        registrationDate: "2026-03-11",
        visitedClasses: ["Powerlifting", "Yoga"]
    }
];

app.get('/members', (req, res) => {
    res.status(200).json(gymMembers);
});

app.post('/members', (req, res) => {
    const newMember = {
        id: Date.now(),
        fullName: req.body.fullName || "Anonymous",
        age: req.body.age || 0,
        hasActiveSubscription: !!req.body.hasActiveSubscription,
        registrationDate: new Date().toISOString(),
        visitedClasses: req.body.visitedClasses || []
    };
    
    gymMembers.push(newMember);
    res.status(201).json(newMember);
});

app.put('/members', (req, res) => {
    const id = parseInt(req.query.id);
    const index = gymMembers.findIndex(m => m.id === id);
    if (index !== -1) {
        gymMembers[index] = { id, ...req.body };
        res.status(200).json(gymMembers[index]);
    } else {
        res.status(404).send("Not found");
    }
});

app.delete('/members', (req, res) => {
    const id = parseInt(req.query.id);
    const initialLength = gymMembers.length;
    gymMembers = gymMembers.filter(m => m.id !== id);
    
    if (gymMembers.length < initialLength) {
        res.status(200).send("Клиент успешно удален");
    } else {
        res.status(404).send("Клиент не найден");
    }
});

app.use((req, res, next) => {
    try {
        next();
    } catch (err) {
        res.status(500).send("Ошибка сервера: " + err.message);
    }
});

app.listen(PORT, () => {
    console.log(`Сервер тренажерного зала запущен на порту ${PORT}`);
});