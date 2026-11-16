"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerEntities = void 0;
const routes_1 = __importDefault(require("./users/routes"));
const routes_2 = __importDefault(require("./others/routes"));
const routes_3 = __importDefault(require("./subjects/routes"));
const routes_4 = __importDefault(require("./questions/routes"));
const routes_5 = __importDefault(require("./tests/routes"));
const routes_6 = __importDefault(require("./userResponse/routes"));
const routes_7 = __importDefault(require("./views/routes"));
const registerEntities = (app) => {
    app.use("/users", routes_1.default);
    app.use("/sessions", routes_2.default);
    app.use("/subjects", routes_3.default);
    app.use("/questions", routes_4.default);
    app.use("/tests", routes_5.default);
    app.use("/userResponse", routes_6.default);
    app.use("/views", routes_7.default);
};
exports.registerEntities = registerEntities;
exports.default = exports.registerEntities;
