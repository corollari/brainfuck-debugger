var cells2draw = 19;
var maxValue = 0xFF;
var textMarginInMemoryDebugger = 5;
var font = "20px serif";
var dragSpeed = 0.5;
var breakpointChar = '#';
//TODO: Add undo functionality

function runBF() {
    var instruction = 0;
    var memory = [0];
    var pointer = 0;
    var loopStack = [];
    var inputPointer = 0;
    var code = document.getElementById("code").innerText;
    memoryDebugger.init(memory);

    return function (executeLength) { //ExecuteLength == -1 -> Execute forever
        try {
            while (instruction < code.length && (executeLength--) != 0) {
                switch (code.charAt(instruction)) {
                    case '+':
                        incrementCell(memory, pointer);
                        break;
                    case '-':
                        memory[pointer]--;
                        wrap(memory, pointer);
                        break;
                    case '>':
                        pointer++;
                        initializeMemory(memory, pointer);
                        memoryDebugger.setCellPointed(pointer);
                        break;
                    case '<':
                        pointer--;
                        initializeMemory(memory, pointer);
                        memoryDebugger.setCellPointed(pointer);
                        break;
                    case '[':
                        if (memory[pointer] != 0) {
                            loopStack.push(instruction);
                        }
                        else {
                            let end, beginning = 0;
                            let nOpeningParens = 1, nClosingParens = 0;
                            let code2search = code.substr(instruction + 1);
                            do {
                                end = code2search.substr(beginning).indexOf(']');
                                nClosingParens++;
                                if (end == -1) {
                                    throw "Missing closing parens";
                                }
                                let str = code2search.substr(beginning, end);
                                for (let i = 0; i < str.length; i++) {
                                    if (str[i] == '[') {
                                        nOpeningParens++;
                                    }
                                }
                                beginning += end + 1;
                            } while (nOpeningParens != nClosingParens);
                            instruction += beginning;
                        }
                        break;
                    case ']':
                        if (loopStack.length == 0) {
                            throw "Missing opening parens";
                        }
                        if (memory[pointer] != 0) {
                            instruction = loopStack[loopStack.length - 1];
                        }
                        else {
                            loopStack.pop();
                        }
                        break;
                    case '.':
                        print(String.fromCharCode(memory[pointer]));
                        break;
                    case ',':
                        let brainFuckInput = document.getElementById("brainFuckInput");
                        if (brainFuckInput.value.length <= inputPointer) {
                            //EOF has been hit
                            memory[pointer] = 0;
                            inputAlert.add();
                            brainFuckInput.addEventListener("change", function (e) { e.srcElement.removeEventListener("change", arguments.callee); executeInstructions(-1) });
                        }
                        else {
                            memory[pointer] = brainFuckInput.value.charCodeAt(inputPointer);
                            inputPointer++;
                        }
                        break;
                    case breakpointChar:
                        instruction++;
                        currentInstructionMarker.updateCurrentInstruction(instruction);
                        enableDebugButtons();
                        memoryDebugger.draw();
                        return;
                        break;
                }
                instruction++;
                while (['+', '-', '>', '<', '[', ']', '.', ',', breakpointChar].indexOf(code[instruction]) == -1 && instruction < code.length) {
                    instruction++;
                }
                if (executeLength == 0) { //It's in debugging mode
                    currentInstructionMarker.updateCurrentInstruction(instruction);
                }
            }
            memoryDebugger.draw();
            return 0; //Successful completion
        }
        catch (error) {
            disableDebugButtons();
            currentInstructionMarker.updateCurrentInstruction(instruction);
            document.getElementById("code").addEventListener("click", function (e) { e.srcElement.removeEventListener("click", arguments.callee); currentInstructionMarker.removeCurrentInstructionMarker(); });
            alert("Critical error: " + error);
        }
        memoryDebugger.draw();
        return -1; //Error has happened
    }
}

function enableDebugButtons() {
    var buttons = [document.getElementById("step"), document.getElementById("resume"), document.getElementById("stop")];
    for (let i = 0; i < buttons.length; i++) {
        buttons[i].classList.remove("disabled");
        buttons[i].disabled = false;
    }
    document.getElementById("code").contentEditable = false;
    $('#code').tooltip('enable');
}

function disableDebugButtons() {
    var buttons = [document.getElementById("step"), document.getElementById("resume"), document.getElementById("stop")];
    for (let i = 0; i < buttons.length; i++) {
        buttons[i].classList.add("disabled");
        buttons[i].disabled = true;
    }
    document.getElementById("code").contentEditable = true;
    $('#code').tooltip('disable');
}

function step() {
    executeInstructions(1);
}

function resumeBF() {
    reset();
    executeInstructions(-1);
}

function reset() {
    disableDebugButtons();
    currentInstructionMarker.removeCurrentInstructionMarker();
    inputAlert.remove();
}

var inputAlert = (function () {
    let parent = document.getElementById("brainFuckInput").parentNode;
    let warningIcon = document.getElementById("warning-icon");
    let working = false;
    return {
        add: function () {
            if (!working) {
                parent.classList.add("has-warning");
                parent.classList.add("has-feedback");
                $('#brainFuckInputParent').tooltip('enable');
                warningIcon.style.display = "block";
                working = true;
            }
        },
        remove: function () {
            if (working) {
                parent.classList.remove("has-warning");
                parent.classList.remove("has-feedback");
                $('#brainFuckInput:parent').tooltip('disable');
                warningIcon.style.display = "none";
                working = false;
            }
        }
    };
})();

function initializeMemory(array, index) {
    if (array[index] == undefined) {
        array[index] = 0;
    }
}

function wrap(array, index) {
    if (array[index] > maxValue) {
        array[index] = 0;
    }
    else if (array[index] < 0) {
        array[index] = maxValue;
    }
}

function incrementCell(array, index) {
    array[index]++;
    wrap(array, index);
}

var currentInstructionMarker = (function () {
    var code = document.getElementById("code");
    var tempElement = document.createElement(code.tagName);
    function getLengthBeginning(text) { //This function's code has plenty of room for optimization
        tempElement.innerText = text;
        var textWithHTMLEntities = tempElement.innerHTML.replace(/<(?:.|\n)*?>/g, "");
        var addedLength = 0;
        var text2compare = "";
        var pointer = 0;
        while (textWithHTMLEntities != text2compare) {
            debugger;
            let char2add = document.getElementById("code").innerHTML[pointer];
            if (char2add == '<') {
                let tagLength = 0;
                do {
                    tagLength++;
                } while (document.getElementById("code").innerHTML[pointer + tagLength] != '>');
                tagLength++;
                addedLength += tagLength;
                pointer += tagLength;
            }
            else {
                text2compare += char2add;
                pointer++;
            }
        }
        //let divCount = ("<div></div>".length - "<br>".length) * (text.split(/\r\n|\r|\n/).length - 2) + "<br>".length * (text.split(/\r\n\r\n|\r\r|\n\n/).length - 1);
        return text2compare.length + addedLength;// + divCount;
    }
    function getLengthChar(text) {
        tempElement.innerText = text;
        return tempElement.innerHTML.length;
    }

    var beginningLength;
    var instructionLength = -1;
    var enclosing = {
        beginning: "<span id='currentInstruction'>",
        beginningLength: -1,
        end: "</span>",
        endLength: -1
    };
    enclosing.beginningLength = enclosing.beginning.length;
    enclosing.endLength = enclosing.end.length;

    return {
        updateCurrentInstruction: function (instruction) {
            this.removeCurrentInstructionMarker();
            this.addCurrentInstructionMarker(instruction);
        },
        removeCurrentInstructionMarker: function () {
            if (instructionLength != -1) {
                code.innerHTML = code.innerHTML.substring(0, beginningLength) + code.innerHTML.substr(beginningLength + enclosing.beginningLength, instructionLength) + code.innerHTML.substr(beginningLength + enclosing.beginningLength + instructionLength + enclosing.endLength);
                instructionLength = -1;
            }
        },
        addCurrentInstructionMarker: function (instruction) {
            instructionLength = getLengthChar(code.innerText[instruction]);
            beginningLength = getLengthBeginning(code.innerText.substring(0, instruction + 1)) - instructionLength;
            code.innerHTML = code.innerHTML.substring(0, beginningLength) + enclosing.beginning + code.innerHTML.substr(beginningLength, instructionLength) + enclosing.end + code.innerHTML.substr(beginningLength + instructionLength);
        },
    };
})();

var memoryDebugger = (function () {
    var middle = (function () {
        var pointer = 0;
        return {
            getValue: function () { return pointer },
            increment: function () { pointer++ },
            decrement: function () { pointer-- },
            reset: function () { pointer = 0 },
        };
    })();
    var widthPerCell = window.innerWidth / cells2draw;
    var histogramHeight = 255;
    var totalHeight = document.getElementById("memoryCanvas").height;
    var textHeight = totalHeight - histogramHeight;
    var array;
    var xOffset;
    var cellPointed;

    var ctx = document.getElementById("memoryCanvas").getContext("2d");
    return {
        draw: function () {
            if (array === undefined) { return; }
            ctx.clearRect(0, 0, widthPerCell * cells2draw, totalHeight);
            for (let i = -1; i < cells2draw + 1; i++) {
                if (middle.getValue() + i - Math.floor(cells2draw / 2) == cellPointed) {
                    ctx.beginPath();
                    var side = 20;
                    ctx.moveTo(xOffset + i * widthPerCell + widthPerCell / 2 - side, 0);
                    ctx.lineTo(xOffset + i * widthPerCell + widthPerCell / 2 + side, 0);
                    ctx.lineTo(xOffset + i * widthPerCell + widthPerCell / 2, Math.sqrt(2) * side);
                    ctx.closePath();
                    ctx.strokeStyle = "rgb(0, 153, 0)";
                    ctx.stroke();
                    ctx.fillStyle = "rgba(153, 255, 102, 0.5)";
                    ctx.fill();
                    ctx.font = "bold " + font;
                }
                else {
                    ctx.font = font;
                }
                ctx.fillStyle = "black";
                ctx.textBaseline = "hanging";
                let textWidth = ctx.measureText(middle.getValue() + i - Math.floor(cells2draw / 2)).width;
                ctx.fillText(middle.getValue() + i - Math.floor(cells2draw / 2), xOffset + i * widthPerCell + (widthPerCell - textWidth) / 2, textMarginInMemoryDebugger);
                ctx.fillStyle = "rgb(" +
                    150 + ", " +
                    150 + ", " +
                    150 + ")"; //Code is like that cause it used to change the color of each bar depending on its height
                ctx.fillRect(xOffset + i * widthPerCell, textHeight, widthPerCell, histogramHeight * (array[middle.getValue() + i - Math.floor(cells2draw / 2)] / maxValue));
            }
        },
        init: function (memoryArray) {
            array = memoryArray;
            middle.reset();
            xOffset = 0;
            cellPointed = 0;
        },
        setOffset: function (newOffset) {
            if (newOffset + xOffset > (Math.floor(xOffset / widthPerCell) + 1) * widthPerCell) {
                middle.decrement();
                xOffset -= widthPerCell;
            }
            else if (newOffset + xOffset < -(Math.floor(-xOffset / widthPerCell) + 1) * widthPerCell) {
                middle.increment();
                xOffset += widthPerCell;
            }
            xOffset += newOffset;
        },
        setCellPointed: function (newCellPointed) {  //If there's ever a need to make the canvas/visualMemoryDebugger follow the cell where changes are being made, the code for that should go inside this function
            cellPointed = newCellPointed;
        },
    };
})();

function print(character) {
    switch (character) {
        case '\n':
            character = '\r\n';
    }
    document.getElementById("output").textContent += character;
}


var executeInstructions;
function runInput() {
    document.getElementById("output").textContent = "";
    executeInstructions = runBF();
    resumeBF();
}

function init() {
    var ctx = document.getElementById("memoryCanvas").getContext("2d");
    ctx.canvas.width = window.innerWidth;
}

var canvasGettingDragged = {
    active: false,
    originalMousePosition: {
        x: 0
    }
};

function dragCanvas(event) {
    if (canvasGettingDragged.active) {
        memoryDebugger.setOffset((event.clientX - canvasGettingDragged.originalMousePosition.x) * dragSpeed);
        canvasGettingDragged.originalMousePosition.x = event.clientX;
        memoryDebugger.draw();
    }
}

function startDragging(event) {
    canvasGettingDragged.active = true;
    canvasGettingDragged.originalMousePosition.x = event.clientX;
}

function stopDragging() {
    canvasGettingDragged.active = false;
}


$(document).ready(function () { //Enable tooltips - Required by Bootstrap
    $('[data-toggle="tooltip"]').tooltip();
    $('[data-toggle="tooltip"]').tooltip('disable');
});