precision mediump float;

varying vec3 screen;

uniform mat4 camera;

int HIT_SPHERE = 0;
int HIT_TRIANGLE = 1;


struct Sphere {
    vec3 center;
    float radius;
    float radius2;
};

Sphere newSphere(vec3 center, float radius) {
    return Sphere(center, radius, radius * radius);
}

{%SPHERES%}

struct Triangle {
    vec3 A, B, C;
};

Triangle newTriangle(vec3 A, vec3 B, vec3 C) {
    return Triangle(A, B, C);
}

{%TRIANGLES%}

bool intersectSphere(vec3 orig, vec3 dir, Sphere sphere, inout float t) {
    float t0, t1;
    vec3 L = sphere.center - orig;
    float tca = dot(L, dir);
    float d2 = dot(L, L) - tca * tca;
    if(d2 > sphere.radius2) {
        return false;
    }
    float thc = sqrt(sphere.radius2 - d2);
    t0 = tca - thc;
    t1 = tca + thc;
    if(t1 < t0) {
        float tmp = t1;
        t1 = t0;
        t0 = tmp;
    }

    if (t0 < 0.0) {
        t0 = t1;
        if (t0 < 0.0) {
            return false;
        }
    }

    if(t0 > t) {
        return false;
    }
    t = t0;
    return true;
}

bool intersectTriangle(vec3 orig, vec3 dir, Triangle triangle, inout float t) {
    vec3 AB = triangle.B - triangle.A;
    vec3 AC = triangle.C - triangle.A;
    vec3 N = cross(AB, AC);
    float area2 = length(N);

    float NdotRayDirection = dot(N, dir);
    if(abs(NdotRayDirection) < 1e-4) {
        return false;
    }

    float d = -dot(N, triangle.A);
    float t0 = -(dot(N, orig) + d);
    if (t0 < 0.0) {
        return false;
    }
    vec3 P = orig + t * dir;

    vec3 C;
    vec3 AP = P - triangle.A;
    C = cross(AB, AP);
    if(dot(N, C) < 0.0) {
        return false;
    }

    vec3 BC = triangle.C - triangle.B;
    vec3 BP = P - triangle.B;
    C = cross(BC, BP);
    if(dot(N, C) < 0.0) {
        return false;
    }

    vec3 CA = triangle.C - triangle.A;
    vec3 CP = P - triangle.C;
    C = cross(CA, CP);
    if(dot(N, C) < 0.0) {
        return false;
    }
    if(t < t0) {
        return false;
    }
    t = t0;
    return true;
}

void main() {
    initSpheres();
    initTriangles();
    vec3 orig = (camera * vec4(vec3(0, 0, -1), 1.0)).xyz;
    vec3 dir = (camera * vec4(normalize(screen), 0.0)).xyz;
    float t = 100000000.0;

    int hit = -1;
    int hitType = -1;

    {%SPHERE_INTERSECTION_TEST%}
    {%TRIANGLE_INTERSECTION_TEST%}

    if(hit > -1) {
        gl_FragColor = vec4(0.2, 0.2, 0.3, 1.0);
    }
    else {
        gl_FragColor = vec4(0, 0, 0, 1);
    }
}