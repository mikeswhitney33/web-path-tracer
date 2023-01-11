const canvas = document.querySelector("canvas");
const gl = canvas.getContext("webgl2");
let fragmentSource, vertexSource;

function makeSphere(sphere) {
    return `newSphere(vec3(${sphere.center.join(",")}), ${sphere.radius})`
}

function makeSpheres(scene) {
    const numSpheres = scene.spheres.length;
    const sphereStatements = [];
    for(let i = 0;i < numSpheres;i++) {
        sphereStatements.push(`spheres[${i}] = ${makeSphere(scene.spheres[i])};`);
    }
    if(numSpheres > 0) {
        return `const int NUM_SPHERES = ${numSpheres};
Sphere spheres[NUM_SPHERES];

void initSpheres() {
    ${sphereStatements.join("\n    ")}
}`;
    }
    else {
        return "void initSpheres(){}";
    }

}

function makeSphereIntersectionTest(scene) {
    if(scene.spheres.length > 0) {
        return `for(int i = 0;i < NUM_SPHERES;i++) {
        if(intersectSphere(orig, dir, spheres[i], t)) {
            hit = i;
            hitType = HIT_SPHERE;
        }
    }`;
    }
    else {
        return "";
    }
}

function makeTriangle(triangle) {
    return `newTriangle(vec3(${triangle.A.join(",")}), vec3(${triangle.B.join(",")}), vec3(${triangle.C.join(",")}))`;
}

function makeTriangles(scene) {
    const numTriangles = scene.triangles.length;
    const triangleStatements = [];
    for(let i = 0;i < numTriangles;i++) {
        triangleStatements.push(`triangles[${i}] = ${makeTriangle(scene.triangles[i])};`);
    }
    if(numTriangles > 0) {
        return `const int NUM_TRIANGLES = ${numTriangles};
Triangle triangles[NUM_TRIANGLES];

void initTriangles() {
    ${triangleStatements.join("\n    ")}
}`;
    }
    else {
        return `void initTriangles(){}`;
    }
}

function makeTriangleIntersectionTest(scene) {
    if(scene.triangles.length > 0) {
        return `for (int i = 0; i < NUM_TRIANGLES; i++) {
            if (intersectTriangle(orig, dir, triangles[i], t)) {
                hit = i;
                hitType = HIT_TRIANGLE;
            }
        }`
    }
    else {
        return "";
    }
}

function shadersLoaded() {
    if (vertexSource === undefined || fragmentSource === undefined) {
        return;
    }
    const scene = {
        spheres: [
            {
                center: [0, 0, 0],
                radius: 0.2,
            },
            {
                center: [0.5, 0, 0],
                radius: 0.2,
            }
        ],
        triangles: [
        ],
    }

    const replacements = {
        "SPHERES": makeSpheres,
        "SPHERE_INTERSECTION_TEST": makeSphereIntersectionTest,
        "TRIANGLES": makeTriangles,
        "TRIANGLE_INTERSECTION_TEST": makeTriangleIntersectionTest,
    }

    for(const [key, makeFunc] of Object.entries(replacements)) {
        fragmentSource = fragmentSource.replace(`{%${key}%}`, makeFunc(scene));
    }
    console.log(fragmentSource);

    const vShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vShader, vertexSource);
    gl.compileShader(vShader);
    if(!gl.getShaderParameter(vShader, gl.COMPILE_STATUS)) {
        alert(`Vertex shader compile error: ${gl.getShaderInfoLog(vShader)}`);
        return;
    }

    const fShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fShader, fragmentSource);
    gl.compileShader(fShader);
    if(!gl.getShaderParameter(fShader, gl.COMPILE_STATUS)) {
        alert(`Fragment shader compile error: ${gl.getShaderInfoLog(fShader)}`);
        return;
    }

    const program = gl.createProgram();
    gl.attachShader(program, vShader);
    gl.attachShader(program, fShader);
    gl.linkProgram(program);
    if(!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        alert(`Program link error: ${gl.getProgramInfoLog(program)}`);
        return;
    }

    const locations = {
        attributes: {
            aPos: gl.getAttribLocation(program, "aPos"),
        },
        uniforms: {
            camera: gl.getUniformLocation(program, "camera"),
        }
    };
    const vBuffer = gl.createBuffer();
    const vertices = [
        -1.0, 1.0,
        -1.0, -1.0,
        1.0, 1.0,
        1.0, -1.0,
    ];
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    gl.useProgram(program);

    gl.uniformMatrix4fv(locations.uniforms.camera, true, new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, -1,
        0, 0, 0, 1
    ]));

    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.enableVertexAttribArray(locations.attributes.aPos)
    gl.vertexAttribPointer(locations.attributes.aPos, 2, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

function main() {
    fetch("shaders/vertex.glsl")
    .then((value) => value.text())
    .then((source) => {
        vertexSource = source;
        shadersLoaded();
    });
    fetch("shaders/fragment.glsl")
    .then(value => value.text())
    .then((source) => {
        fragmentSource = source;
        shadersLoaded();
    });
}
window.onload = main;