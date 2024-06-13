var vertexShaderText = [
    'precision mediump float;',
    '',
    'attribute vec2 vertexPosition;',
    'attribute vec3 vertexColor;',
    'varying vec3 fragColor;',
    '',
    'void main()',
    '{',
    '   fragColor = vertexColor;',
    '   gl_Position = vec4(vertexPosition, 0.0, 1.0);',
    '}',
].join('\n');

var fragmentShaderText = [
    'precision mediump float;',
    '',
    'varying vec3 fragColor;',
    'void main()',
    '{',
    '   gl_FragColor = vec4(fragColor, 1.0);',
    '}',
].join('\n');

var preX = 0, preY = 0;
var gl, program;
var rectangles = [];
var isDrawing = false;
var fps = 144; // Frames per second
var interval = 1000 / fps; // Interval in milliseconds
var red = 1.0, green = 0.0, blue = 0.0;
var rectangleWidth = 0.1; // Default rectangle width

var Init = function () {
    console.log('Working fine');

    var canvas = document.getElementById('surface');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl = canvas.getContext('webgl');

    if (!gl) {
        console.log('WebGL not supported, falling back on experimental-webgl');
        gl = canvas.getContext('experimental-webgl');
    }

    if (!gl) {
        console.log('WebGL not supported');
        alert('Your browser does not support WebGL');
    }

    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

    gl.shaderSource(vertexShader, vertexShaderText);
    gl.shaderSource(fragmentShader, fragmentShaderText);

    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        console.error('ERROR compiling vertex shader!', gl.getShaderInfoLog(vertexShader));
        return;
    }
    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        console.error('ERROR compiling fragment shader!', gl.getShaderInfoLog(fragmentShader));
        return;
    }

    program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('ERROR linking program!', gl.getProgramInfoLog(program));
        return;
    }
    gl.validateProgram(program);
    if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
        console.error('ERROR validating program!', gl.getProgramInfoLog(program));
        return;
    }

    initBuffers();

    var sizeSlider = document.getElementById('sizeSlider');
    rectangleWidth = parseFloat(sizeSlider.value); // Initialize with slider value
    sizeSlider.addEventListener('input', function() {
        rectangleWidth = parseFloat(sizeSlider.value);
    });

    var redSlider = document.getElementById('redSlider');
    redSlider.addEventListener('input', function() {
        red = parseFloat(redSlider.value);
    });

    var greenSlider = document.getElementById('greenSlider');
    greenSlider.addEventListener('input', function() {
        green = parseFloat(greenSlider.value);
    });

    var blueSlider = document.getElementById('blueSlider');
    blueSlider.addEventListener('input', function() {
        blue = parseFloat(blueSlider.value);
    });

    canvas.addEventListener('mousedown', function(event) {
        isDrawing = true;
        var rect = canvas.getBoundingClientRect();
        var x = event.clientX - rect.left;
        var y = event.clientY - rect.top;

        // Convert the click coordinates to WebGL coordinates
        var webGLX = (x / canvas.width) * 2 - 1;
        var webGLY = (y / canvas.height) * -2 + 1;

        preX = webGLX;
        preY = webGLY;
    });

    canvas.addEventListener('mouseup', function() {
        isDrawing = false;
    });

    canvas.addEventListener('mousemove', function(event) {
        if (isDrawing) {
            var rect = canvas.getBoundingClientRect();
            var x = event.clientX - rect.left;
            var y = event.clientY - rect.top;

            // Convert the mouse coordinates to WebGL coordinates
            var webGLX = (x / canvas.width) * 2 - 1;
            var webGLY = (y / canvas.height) * -2 + 1;

            // Update the rectangle vertices
            addRectangleVertices(preX, preY, webGLX, webGLY);

            // Update previous positions
            preX = webGLX;
            preY = webGLY;
        }
    });

    window.addEventListener('resize', function() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    });

    // Set up the frame limiting
    setInterval(drawScene, interval);
};

function initBuffers() {
    gl.createBuffer();
}

function drawScene() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(program);

    for (var i = 0; i < rectangles.length; i++) {
        var rectangleVertices = rectangles[i];
        var rectangleVertexBufferObject = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, rectangleVertexBufferObject);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(rectangleVertices), gl.STATIC_DRAW);

        var positionAttribLocation = gl.getAttribLocation(program, 'vertexPosition');
        gl.vertexAttribPointer(
            positionAttribLocation, // Attribute location
            2, // Number of elements per attribute
            gl.FLOAT, // Type of elements
            gl.FALSE,
            5 * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex
            0 // Offset from the beginning of a single vertex to this attribute
        );

        var colorAttribLocation = gl.getAttribLocation(program, 'vertexColor');
        gl.vertexAttribPointer(
            colorAttribLocation, // Attribute location
            3, // Number of elements per attribute
            gl.FLOAT, // Type of elements
            gl.FALSE,
            5 * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex
            2 * Float32Array.BYTES_PER_ELEMENT // Offset from the beginning of a single vertex to this attribute
        );

        gl.enableVertexAttribArray(positionAttribLocation);
        gl.enableVertexAttribArray(colorAttribLocation);

        gl.drawArrays(gl.TRIANGLES, 0, 6); // Draw 6 vertices to form 2 triangles
    }
}

function addRectangleVertices(x1, y1, x2, y2) {
    var width = Math.abs(x2 - x1);
    var height = rectangleWidth / 2;
    var angle = Math.atan2(y2 - y1, x2 - x1);

    var halfDiagonal = Math.sqrt(width * width + height * height) / 2;
    var halfWidth = width / 2;
    var halfHeight = height / 2;

    var cosAngle = Math.cos(angle);
    var sinAngle = Math.sin(angle);

    var dx = halfDiagonal * cosAngle;
    var dy = halfDiagonal * sinAngle;

    var vertices = [
        // First triangle
        x1 + dx - halfHeight * sinAngle, y1 + dy + halfHeight * cosAngle, red, green, blue, // bottom left
        x1 + dx + halfHeight * sinAngle, y1 + dy - halfHeight * cosAngle, red, green, blue, // bottom right
        x1 - dx - halfHeight * sinAngle, y1 - dy + halfHeight * cosAngle, red, green, blue, // top left

        // Second triangle
        x1 - dx - halfHeight * sinAngle, y1 - dy + halfHeight * cosAngle, red, green, blue, // top left
        x1 + dx + halfHeight * sinAngle, y1 + dy - halfHeight * cosAngle, red, green, blue, // bottom right
        x1 - dx + halfHeight * sinAngle, y1 - dy - halfHeight * cosAngle, red, green, blue  // top right
    ];

    rectangles.push(vertices);
}

window.onload = Init;
