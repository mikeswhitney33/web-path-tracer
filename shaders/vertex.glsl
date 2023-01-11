attribute vec2 aPos;

varying vec3 screen;

void main() {
    gl_Position = vec4(aPos, 0, 1);
    screen = vec3(aPos, 1.0);
}