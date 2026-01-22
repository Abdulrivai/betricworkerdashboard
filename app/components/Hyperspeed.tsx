'use client';

import { useEffect, useRef, FC } from 'react';
import * as THREE from 'three';
import { BloomEffect, EffectComposer, EffectPass, RenderPass } from 'postprocessing';

interface HyperspeedProps {
    className?: string;
}

const Hyperspeed: FC<HyperspeedProps> = ({ className = '' }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const animationFrameRef = useRef<number | undefined>(undefined);

    useEffect(() => {
        if (!containerRef.current) return;

        const container = containerRef.current;

        // Scene setup
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(
            90,
            container.offsetWidth / container.offsetHeight,
            0.1,
            1000
        );
        camera.position.set(0, 5, 5);
        camera.lookAt(0, 0, -50);

        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });
        renderer.setSize(container.offsetWidth, container.offsetHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(renderer.domElement);

        // Composer for post-processing
        const composer = new EffectComposer(renderer);
        const renderPass = new RenderPass(scene, camera);
        composer.addPass(renderPass);

        // Bloom effect
        const bloomPass = new EffectPass(
            camera,
            new BloomEffect({
                intensity: 1.5,
                luminanceThreshold: 0.15,
                luminanceSmoothing: 0.9
            })
        );
        composer.addPass(bloomPass);

        // Background and fog
        scene.background = new THREE.Color(0x000000);
        scene.fog = new THREE.Fog(0x000000, 10, 100);

        // Create animated road
        const roadGeometry = new THREE.PlaneGeometry(20, 200, 1, 50);
        const roadMaterial = new THREE.MeshBasicMaterial({
            color: 0x0a0a0a,
            side: THREE.DoubleSide
        });
        const road = new THREE.Mesh(roadGeometry, roadMaterial);
        road.rotation.x = -Math.PI / 2;
        road.position.y = 0;
        scene.add(road);

        // Road lines
        const createLines = () => {
            const lineGeometry = new THREE.PlaneGeometry(0.3, 200, 1, 50);
            const lineMaterial = new THREE.MeshBasicMaterial({
                color: 0x333333,
                side: THREE.DoubleSide
            });

            // Center line
            const centerLine = new THREE.Mesh(lineGeometry, lineMaterial);
            centerLine.rotation.x = -Math.PI / 2;
            centerLine.position.y = 0.01;
            scene.add(centerLine);

            // Side lines
            [-8, 8].forEach(x => {
                const sideLine = new THREE.Mesh(lineGeometry, lineMaterial.clone());
                sideLine.rotation.x = -Math.PI / 2;
                sideLine.position.set(x, 0.01, 0);
                scene.add(sideLine);
            });
        };
        createLines();

        // Car lights
        const lights: THREE.Mesh[] = [];

        const createCarLight = (color: number, x: number, z: number) => {
            const geometry = new THREE.SphereGeometry(0.15, 8, 8);
            const material = new THREE.MeshBasicMaterial({ color });
            const light = new THREE.Mesh(geometry, material);
            light.position.set(x, 0.5, z);
            scene.add(light);
            lights.push(light);
            return light;
        };

        // Create multiple car lights
        for (let i = 0; i < 20; i++) {
            // Right lane - cyan (moving away)
            createCarLight(
                0x00ffff,
                4 + Math.random() * 2,
                -Math.random() * 100
            );

            // Left lane - pink (moving closer)
            createCarLight(
                0xff00ff,
                -4 - Math.random() * 2,
                -Math.random() * 100
            );
        }

        // Animation
        const clock = new THREE.Clock();

        const animate = () => {
            animationFrameRef.current = requestAnimationFrame(animate);

            const elapsedTime = clock.getElapsedTime();

            // Animate car lights
            lights.forEach((light, index) => {
                if (index % 2 === 0) {
                    // Right side - moving away
                    light.position.z -= 0.5;
                    if (light.position.z < -100) {
                        light.position.z = 0;
                    }
                } else {
                    // Left side - moving closer
                    light.position.z += 0.8;
                    if (light.position.z > 0) {
                        light.position.z = -100;
                    }
                }
            });

            // Camera subtle movement
            camera.position.y = 5 + Math.sin(elapsedTime * 0.5) * 0.3;
            camera.lookAt(0, 0, -50);

            composer.render();
        };

        animate();

        // Handle resize
        const handleResize = () => {
            const width = container.offsetWidth;
            const height = container.offsetHeight;

            camera.aspect = width / height;
            camera.updateProjectionMatrix();

            renderer.setSize(width, height);
            composer.setSize(width, height);
        };

        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);

            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }

            composer.dispose();
            renderer.dispose();

            // Dispose geometries and materials
            scene.traverse((object) => {
                if (object instanceof THREE.Mesh) {
                    object.geometry.dispose();
                    if (object.material instanceof THREE.Material) {
                        object.material.dispose();
                    }
                }
            });

            scene.clear();

            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement);
            }
        };
    }, []);

    return <div ref={containerRef} className={`w-full h-full ${className}`} />;
};

export default Hyperspeed;
