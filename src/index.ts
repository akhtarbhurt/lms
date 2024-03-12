import dotenv from "dotenv"
import connectDB from "./db/db";
import { app } from "./app";

dotenv.config({
    path: "./.env"
});

connectDB()
.then(()=>{
    app.listen(process.env.PORT || 3000 , ()=>{
        console.log(`server is running at port : ${process.env.PORT}`)
    } )
})