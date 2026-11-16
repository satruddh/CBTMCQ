const userRoutes = require('./users/routes');
const othersRoutes = require('./others/routes');
const subjectsRoutes = require('./subjects/routes');


module.exports = (app) => {
    app.use("/users", userRoutes);
    app.use("/sessions", othersRoutes);
    app.use("/subjects", subjectsRoutes);
}