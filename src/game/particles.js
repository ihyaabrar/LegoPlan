import * as THREE from 'three';

/**
 * 3D Sparkle & LEGO Confetti Particle System for assembly snaps & victory celebration
 */
export class ParticleSystem {
  constructor(scene) {
    this.group = new THREE.Group();
    this.group.name = 'GameParticles';
    scene.add(this.group);

    this.particles = [];
    this.sharedGeo = new THREE.BoxGeometry(0.24, 0.14, 0.24);
    this.palette = [0x38d9ff, 0x42f59b, 0xffd147, 0xd42626, 0xffffff, 0x5ca8ff];
  }

  /** Burst sparkles around a snapped 3D part */
  burst(center, count = 26, speed = 7.5) {
    for (let i = 0; i < count; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: this.palette[i % this.palette.length],
        transparent: true,
        opacity: 1,
      });
      const mesh = new THREE.Mesh(this.sharedGeo, mat);
      mesh.position.copy(center);

      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const spd = speed * (0.45 + Math.random() * 0.75);
      const vel = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta) * spd,
        Math.abs(Math.cos(phi)) * spd + 2.5,
        Math.sin(phi) * Math.sin(theta) * spd
      );

      const rotVel = new THREE.Vector3(
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 12
      );

      this.group.add(mesh);
      this.particles.push({
        mesh,
        vel,
        rotVel,
        life: 0,
        maxLife: 0.7 + Math.random() * 0.45,
      });
    }
  }

  /** Big celebratory LEGO confetti shower around the completed F-77 Lancer */
  victoryShower(center) {
    for (let wave = 0; wave < 3; wave++) {
      setTimeout(() => {
        const origin = center.clone().add(
          new THREE.Vector3((Math.random() - 0.5) * 10, 4 + Math.random() * 4, (Math.random() - 0.5) * 10)
        );
        this.burst(origin, 48, 12.5);
      }, wave * 280);
    }
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        this.group.remove(p.mesh);
        p.mesh.material.dispose();
        this.particles.splice(i, 1);
        continue;
      }
      const progress = p.life / p.maxLife;
      p.vel.y -= 14.5 * dt; // gravity
      p.mesh.position.addScaledVector(p.vel, dt);
      p.mesh.rotation.x += p.rotVel.x * dt;
      p.mesh.rotation.y += p.rotVel.y * dt;
      p.mesh.rotation.z += p.rotVel.z * dt;
      const scale = 1 - progress * 0.7;
      p.mesh.scale.setScalar(scale);
      p.mesh.material.opacity = 1 - Math.pow(progress, 1.8);
    }
  }
}
