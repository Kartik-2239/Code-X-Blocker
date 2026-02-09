import chokidar from "chokidar";

if (!process.env.CODEX_SESSION_PATH){
    console.error("CODEX_SESSION_PATH is not set");
    process.exit(1);
}
const codexSessionPath = process.env.CODEX_SESSION_PATH || "";
console.log("Watching:", codexSessionPath);
const now = new Date();
const currentDir = codexSessionPath + "/" + now.getFullYear() + "/" + (now.getMonth() + 1).toString().padStart(2, '0') + "/" + now.getDate().toString().padStart(2, '0');

console.log("Watching directory:", currentDir);
var k = 0
let lastText = "";

const types = ["response_item", "turn_context", "event_msg"]

function sendAction(action: string) {
    fetch(`http://localhost:3000/${action}`).then(response => response.json()).then(data => {
        console.log(data);
    }).catch(error => {
        console.error("Error:", error);
    });
}
let lastSentAction = "";
chokidar.watch(codexSessionPath, { ignoreInitial: true }).on("change", async (path, stats) => {
    k++;
    var timeStamps: number[] = [];
    console.log("==".repeat(100));
    console.log("Change count:", k);
    console.log("==".repeat(100));
    const newText = await Bun.file(path).text();
    var insertedText = "";
    if (newText.startsWith(lastText)) {
        insertedText = newText.slice(lastText.length, newText.length);
        for (const line of insertedText.split("\n")) {
            try{
                const json = JSON.parse(line);
                if (json.type === "response_item" && json.payload.type === "message" && json.payload.content[0].type === "output_text") {
                    sendAction("block");
                    lastSentAction = "block";
                    break;
                }else if (lastSentAction === "block" && json.type === "event_msg"){
                    sendAction("block");
                    lastSentAction = "block";
                }
                else {
                    sendAction("unblock");
                    lastSentAction = "unblock";
                }
                console.log(json.timestamp);
                timeStamps.push(json.timestamp);
            } catch (error) {
                
            }
        }
            
    }
    lastText = await Bun.file(path).text();

    console.log("File changed:", path.split("/").pop());

    // sendAction("unblock");
});