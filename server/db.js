
const { Client } = require("pg");
const bcrypt = require("bcrypt");

// Initialize PostgreSQL client
const client = new Client({
    connectionString: "postgres://Almig:Jodahoale3@@localhost:5432/the_acme_store",
});


client.connect()
    .then(() => console.log("Connected to PostgreSQL database"))
    .catch(err => console.error("Connection error", err.stack));

/**
 * Create and reset database tables
 */
const createTables = async () => {
    try {
        await client.query(`
           DROP TABLE IF EXISTS favorites;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS users;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
    id SERIAL PRIMARY KEY,  -- Use SERIAL for auto-incrementing integer
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

CREATE TABLE products (
    id SERIAL PRIMARY KEY,  -- Use SERIAL for auto-incrementing integer
    name VARCHAR(255) NOT NULL
);

CREATE TABLE favorites (
    id SERIAL PRIMARY KEY,  -- Use SERIAL for auto-incrementing integer
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,  -- Use INTEGER for foreign key
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE NOT NULL,  -- Use INTEGER for foreign key
    UNIQUE(user_id, product_id)
);
        `);
        console.log("Tables created successfully!");
    } catch (error) {
        console.error("Error creating tables:", error);
    }
};

/**
 * Create a new user with a hashed password
 * @param {string} username - The username for the user
 * @param {string} password - The plaintext password to be hashed
 * @returns {Object} - The newly created user
 */
const createUser = async (username, password) => {
    try {
        const SALT_ROUNDS = 10;
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        const { rows: [user] } = await client.query(`
            INSERT INTO users (username, password)
            VALUES ($1, $2)
            RETURNING id, username;
        `, [username, hashedPassword]);
        return user;
    } catch (error) {
        console.error("Error creating user:", error);
        throw error;
    }
};

/**
 * Fetch all users
 * @returns {Array} - List of users (id and username only)
 */
const fetchUsers = async () => {
    try {
        const { rows } = await client.query(`SELECT id, username FROM users;`);
        return rows;
    } catch (error) {
        console.error("Error fetching users:", error);
        throw error;
    }
};

/**
 * Create a new product
 * @param {string} name - The name of the product
 * @returns {Object} - The newly created product
 */
const createProduct = async (name) => {
    try {
        const { rows: [product] } = await client.query(`
            INSERT INTO products (name)
            VALUES ($1)
            RETURNING *;
        `, [name]);
        return product;
    } catch (error) {
        console.error("Error creating product:", error);
        throw error;
    }
};

/**
 * Fetch all products
 * @returns {Array} - List of all products
 */
const fetchProducts = async () => {
    try {
        const { rows } = await client.query(`SELECT * FROM products;`);
        return rows;
    } catch (error) {
        console.error("Error fetching products:", error);
        throw error;
    }
};

/**
 * Create a favorite for a user
 * @param {string} userId - The ID of the user
 * @param {string} productId - The ID of the product
 * @returns {Object} - The newly created favorite
 */
const createFavorite = async (userId, productId) => {
    try {
        const { rows: [favorite] } = await client.query(`
            INSERT INTO favorites (user_id, product_id)
            VALUES ($1, $2)
            RETURNING *;
        `, [userId, productId]);
        return favorite;
    } catch (error) {
        console.error("Error creating favorite:", error);
        throw error;
    }
};

/**
 * Fetch all favorites for a user
 * @param {string} userId - The ID of the user
 * @returns {Array} - List of products favorited by the user
 */
const fetchFavorites = async (userId) => {
    try {
        const { rows } = await client.query(`
            SELECT products.*
            FROM favorites
            JOIN products ON favorites.product_id = products.id
            WHERE favorites.user_id = $1;
        `, [userId]);
        return rows;
    } catch (error) {
        console.error("Error fetching favorites:", error);
        throw error;
    }
};

/**
 * Delete a favorite by ID
 * @param {string} favoriteId - The ID of the favorite to delete
 */
const destroyFavorite = async (favoriteId) => {
    try {
        await client.query(`
            DELETE FROM favorites WHERE id = $1;
        `, [favoriteId]);
    } catch (error) {
        console.error("Error deleting favorite:", error);
        throw error;
    }
};

// Export client and all utility functions
module.exports = {
    client,
    createTables,
    createUser,
    fetchUsers,
    createProduct,
    fetchProducts,
    createFavorite,
    fetchFavorites,
    destroyFavorite,
};