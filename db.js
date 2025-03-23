const fs = require("fs")
const { v4: uuidv4 } = require('uuid');

const dbPath = path.join(__dirname, 'db.json');

console.log("running DB...")
export default class DB{
    constructor(){
        console.log("creating DB...")
        this.data = JSON.parse(fs.readFileSync(dbPath));
    }
}