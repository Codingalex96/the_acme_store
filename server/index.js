require('dotenv').config();
const express = require("express");
const {
    createTables,
    createUser,
    fetchUsers,
    createProduct,
    fetchProducts,
    createFavorite,
    fetchFavorites,
    destroyFavorite
} = require("./db");

const app = express();
app.use(express.json());


app.post('/api/users', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await createUser(username, password); 
        res.status(201).json(user);
    } catch (err) {
        console.error("Error creating user:", err);
        res.status(500).json({ error: "Failed to create user" });
    }
});


app.get("/api/users", async (req, res, next) => {
    try {
        const users = await fetchUsers();
        res.json(users);
    } catch (error) {
        next(error);
    }
});


app.get("/api/products", async (req, res, next) => {
    try {
        const products = await fetchProducts();
        res.json(products);
    } catch (error) {
        next(error);
    }
});


app.get("/api/users/:id/favorites", async (req, res, next) => {
    try {
        const favorites = await fetchFavorites(req.params.id);
        res.json(favorites);
    } catch (error) {
        next(error);
    }
});


app.post("/api/users/:id/favorites", async (req, res, next) => {
    try {
        const { product_id } = req.body;
        if (!product_id) {
            return res.status(400).json({ error: "product_id is required" });
        }
        const favorite = await createFavorite(req.params.id, product_id);
        res.status(201).json(favorite);
    } catch (error) {
        
        if (error.code === '23505') { 
            res.status(409).json({ error: "Favorite already exists for this user and product" });
        } else {
            next(error);
        }
    }
});


app.delete("/api/users/:userId/favorites/:id", async (req, res, next) => {
    try {
        await destroyFavorite(req.params.id);
        res.status(204).send();
    } catch (error) {
        next(error);
    }
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
});

// Start the server and create tables
const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
    console.log(`Server running on http://localhost:${PORT}`);
    await createTables();

    

    
    try {
        const user = await createUser("john_doe", "securepassword");
        const product1 = await createProduct("Product A");
        const product2 = await createProduct("Product B");
        await createFavorite(user.id, product1.id);
        await createFavorite(user.id, product2.id);
        console.log("Sample data created");
    } catch (error) {
        console.error("Error seeding data:", error);
    }
    
});