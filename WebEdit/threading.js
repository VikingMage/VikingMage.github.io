var timerId;
onmessage = function(e){
    const data = e.data;
    if (data[0] == "calculate") {
        var mystring = data[1];
        if (mystring){
            var wc = mystring.trim().split(/\s+/).length;
            postMessage(["word_count",wc]);
        }
    } else if (data == "start") {
        timerId = setInterval(remind, 1000);
    } else if (data == "stop") {
        this.clearInterval(timerId);
    }
}

function remind() {    
    postMessage("update");
}

