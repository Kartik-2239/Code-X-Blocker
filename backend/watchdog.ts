import chokidar from "chokidar";

if (!process.env.CODEX_SESSION_PATH){
    console.error("CODEX_SESSION_PATH is not set");
    process.exit(1);
}

const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const codexSessionPath = process.env.CODEX_SESSION_PATH || "";
console.log("Watching:", codexSessionPath);
console.log("On port:", port);

const currentDir = codexSessionPath + "/" + new Date().getFullYear() + "/" + (new Date().getMonth() + 1).toString().padStart(2, '0') + "/" + new Date().getDate().toString().padStart(2, '0');
console.log("Watching:", currentDir);
// main : response_item, turn_context, event_msg
// payload : message

function sendAction(action: string) {
    fetch(`http://localhost:${port}/${action}`).then(response => response.json()).then(data => {
        console.log(data);
    }).catch(error => {
        console.error("Error:", error);
    });
}

let lastText = "";
let lastSentAction = "";
const watcher = chokidar.watch(codexSessionPath, { ignoreInitial: true });
const handler = async (path: string) => {
    if (!path.endsWith(".jsonl")) {
        return;
    }
    console.log("==".repeat(100));
    const newText = await Bun.file(path).text();
    var insertedText = "";
    if (newText.startsWith(lastText)) {
        insertedText = newText.slice(lastText.length, newText.length);
        for (const line of insertedText.split("\n").filter(line => line.trim() !== "")) {
            try{
                const json = JSON.parse(line);
                if (json.type === "response_item" && json.payload.type === "message" && json.payload.content[0].type === "output_text") {
                    sendAction("block");
                    lastSentAction = "block";
                    break;
                }else if (line.toString().includes("turn_aborted")){
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
            } catch (error) {
                console.error("Unable to parse JSON:", line);
            }
        }
            
    }
    lastText = await Bun.file(path).text();

    console.log("File changed:", path.split("/").pop());
};
watcher.on("change", handler);
watcher.on("add", handler);