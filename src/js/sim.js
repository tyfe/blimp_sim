/* eslint-disable no-console */
import Matter from 'matter-js';

const { Engine } = Matter;
const { Render } = Matter;
const { Runner } = Matter;
const { World } = Matter;
const { Bodies } = Matter;

// create engine
const engine = Engine.create();
const { world } = engine;

const motorForce = 0.00005 * (1 / 127);
const blimpRadius = 30;
const timeDelta = 16.666; // time delta in ms

// create renderer
const render = Render.create({
  element: document.getElementById('phys-canvas'),
  engine,
  options: {
    width: 800,
    height: 600,
    showAngleIndicator: true,
    wireframes: true,
  },
});

Render.run(render);

// create runner
const runner = Runner.create();

world.gravity.y = 0;

// add stiff global constraint
const blimpBase = Bodies.circle(40000, 30000, blimpRadius, {
  density: 0.001,
  friction: 0.7,
  frictionStatic: 0,
  frictionAir: 0.02,
  restitution: 1,
  ground: false,
});

Matter.Body.setAngle(blimpBase, Math.PI / -2);

// const leftWall = Bodies.rectangle(-10, 300, 60, 610, { isStatic: true });
// const rightWall = Bodies.rectangle(810, 300, 60, 610, { isStatic: true });
// const topWall = Bodies.rectangle(405, 15, 810, 30, { isStatic: true });
// const bottomWall = Bodies.rectangle(405, 585, 810, 30, { isStatic: true });

World.add(world, [blimpBase]);

// fit the render viewport to the scene
Render.lookAt(render, {
  min: { x: 0, y: 0 },
  max: { x: 800, y: 600 },
});

const airResistSlider = document.getElementById('airResistance');
const airResistSliderText = document.getElementById('airResistanceValue');
const windSpeedSlider = document.getElementById('windSpeed');
const windSpeedSliderText = document.getElementById('windSpeedValue');
const leftMotorSpeedElement = document.getElementById('motorScaleValue1');
const rightMotorSpeedElement = document.getElementById('motorScaleValue2');

// eslint-disable-next-line no-unused-vars
let windSpeed = 0;

airResistSlider.addEventListener('change', () => {
  airResistSliderText.value = airResistSlider.value;
});

airResistSliderText.addEventListener('change', () => {
  airResistSlider.value = airResistSliderText.value;
});

windSpeedSlider.addEventListener('change', () => {
  windSpeedSliderText.value = windSpeedSlider.value;
  windSpeed = parseFloat(windSpeedSlider.value);
});

windSpeedSliderText.addEventListener('change', () => {
  windSpeedSlider.value = windSpeedSliderText.value;
  windSpeed = parseFloat(windSpeedSlider.value);
});

// reset values
airResistSlider.value = 50;
airResistSliderText.value = 50;
windSpeedSlider.value = 0;
windSpeedSliderText.value = 0;
// motorScaleValueText.value = motorScale;

let windPosition = Math.random() * Math.PI * 2;
let windDirection = Math.random() * Math.PI * 2;

let leftMotorLevel = 0;
let rightMotorLevel = 0;
let acceleration = { x: 0, y: 0 };

const drawVectors = () => {
  const { canvas } = render;
  const { angle } = blimpBase;
  const ctx = canvas.getContext('2d');
  const positionOffset = {
    x: canvas.width / 2,
    y: canvas.height / 2,
  };
  const windForceVector = {
    x: windSpeed * Math.cos(windDirection),
    y: windSpeed * Math.sin(windDirection),
  };
  const windAppPoint = Matter.Vector.add(positionOffset, {
    x: blimpRadius * Math.cos(windPosition),
    y: blimpRadius * Math.sin(windPosition),
  });

  ctx.lineWidth = 1;
  ctx.strokeStyle = '#00ffff';
  ctx.beginPath();

  ctx.moveTo(positionOffset.x, positionOffset.y);
  ctx.lineTo(positionOffset.x + 100 * blimpBase.velocity.x,
    positionOffset.y + 100 * blimpBase.velocity.y);

  ctx.stroke();

  ctx.strokeStyle = '#ff00ff';
  if (blimpBase.leftMotorForce) {
    const position = Matter.Vector.add(positionOffset,
      { x: 20 * Math.cos(angle + Math.PI / 2), y: 20 * Math.sin(angle + Math.PI / 2) });
    ctx.beginPath();
    ctx.moveTo(position.x, position.y);
    ctx.lineTo(position.x + 300000 * blimpBase.leftMotorForce.x,
      position.y + 300000 * blimpBase.leftMotorForce.y);
    ctx.stroke();
  }
  if (blimpBase.rightMotorForce) {
    const position = Matter.Vector.add(positionOffset,
      { x: 20 * Math.cos(angle - Math.PI / 2), y: 20 * Math.sin(angle - Math.PI / 2) });
    ctx.beginPath();
    ctx.moveTo(position.x, position.y);
    ctx.lineTo(position.x + 300000 * blimpBase.rightMotorForce.x,
      position.y + 300000 * blimpBase.rightMotorForce.y);
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.moveTo(windAppPoint.x, windAppPoint.y);
  ctx.lineTo(windAppPoint.x + 900000 * windForceVector.x,
    windAppPoint.y + 900000 * windForceVector.y);
  ctx.stroke();

  // let reward = 1 - (1.5 * Math.abs(blimpBase.speed));
  let reward = 0;
  const accScalar = Math.sqrt(acceleration.x ** 2, acceleration.y ** 2);
  reward += 1 - (4 * blimpBase.speed) ** 2 - (100000 * accScalar) ** 2
    - (100 * blimpBase.angularSpeed) ** 2;

  ctx.font = '20px Arial';
  ctx.strokeText(`speed: ${blimpBase.speed.toFixed(3)}`, 10, 50);
  ctx.strokeText(`reward: ${reward.toFixed(1)}`, 10, 80);
  ctx.strokeText(`angle: ${(Math.atan2(Math.sin(blimpBase.angle), Math.cos(blimpBase.angle)) + Math.PI).toFixed(2)}`, 10, 110);
  ctx.strokeText(`acc: ${accScalar.toExponential(2)}`, 10, 140);
  ctx.strokeText(`angSpeed: ${blimpBase.angularVelocity.toExponential(2)}`, 10, 170);
};

const centerCamera = (body) => {
  Matter.Render.lookAt(render, body, { x: 400, y: 300 });
};

Matter.Events.on(engine, 'beforeTick', () => {
  let leftMotorForce = { x: 0, y: 0 };
  let rightMotorForce = { x: 0, y: 0 };

  const { angle } = blimpBase;
  const rightPositionOffset = Matter.Vector.add(blimpBase.position,
    { x: 20 * Math.cos(angle - Math.PI / 2), y: 20 * Math.sin(angle - Math.PI / 2) });
  const leftPositionOffset = Matter.Vector.add(blimpBase.position,
    { x: 20 * Math.cos(angle + Math.PI / 2), y: 20 * Math.sin(angle + Math.PI / 2) });
  leftMotorForce = Matter.Vector.add(leftMotorForce, {
    x: leftMotorLevel * motorForce * Math.cos(angle),
    y: leftMotorLevel * motorForce * Math.sin(angle),
  });
  rightMotorForce = Matter.Vector.add(rightMotorForce, {
    x: rightMotorLevel * motorForce * Math.cos(angle),
    y: rightMotorLevel * motorForce * Math.sin(angle),
  });


  // interval on wind application
  Matter.Body.applyForce(blimpBase, Matter.Vector.add(blimpBase.position, {
    x: blimpRadius * Math.cos(windPosition),
    y: blimpRadius * Math.sin(windPosition),
  }), {
    x: windSpeed * Math.cos(windDirection),
    y: windSpeed * Math.sin(windDirection),
  });
  Matter.Body.applyForce(blimpBase, leftPositionOffset, leftMotorForce);
  Matter.Body.applyForce(blimpBase, rightPositionOffset, rightMotorForce);

  const totalForce = Matter.Vector.add(Matter.Vector.add(leftMotorForce, rightMotorForce), {
    x: windSpeed * Math.cos(windDirection),
    y: windSpeed * Math.sin(windDirection),
  });

  acceleration = {
    x: totalForce.x / blimpBase.mass,
    y: totalForce.y / blimpBase.mass,
  };

  blimpBase.leftMotorForce = leftMotorForce;
  blimpBase.rightMotorForce = rightMotorForce;

  centerCamera(blimpBase);
});

// setup for remote connection
const socket = new WebSocket('ws://localhost:5005');

socket.onopen = () => {
  console.log('Connection to localhost succeeded');
};

Matter.Events.on(engine, 'afterUpdate', () => {
  acceleration = Matter.Vector.rotate(acceleration, blimpBase.angle);
  const message = {
    acceleration,
    angularVelocity: blimpBase.angularVelocity,
    linearVelocity: Matter.Vector.rotate(blimpBase.velocity, blimpBase.angle),
  };
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
  }

  leftMotorSpeedElement.value = leftMotorLevel;
  rightMotorSpeedElement.value = rightMotorLevel;
});

Matter.Events.on(render, 'afterRender', () => {
  drawVectors();
});

socket.onmessage = (e) => {
  let { data } = e;
  data = JSON.parse(data);
  if (data.leftPowerLevel && data.rightPowerLevel) {
    leftMotorLevel = parseInt(data.leftPowerLevel, 10);
    rightMotorLevel = parseInt(data.rightPowerLevel, 10);
  }
  Matter.Runner.tick(runner, engine, timeDelta);

  if (data.reset) {
    Matter.Body.setPosition(blimpBase, { x: 400, y: 300 });
    Matter.Body.setVelocity(blimpBase, { x: 0, y: 0 });
    Matter.Body.setAngularVelocity(blimpBase, 0);
    Matter.Body.setAngle(blimpBase, Math.PI / -2);
    windSpeed = Math.random() * 0.00003 + 0.00002;
    // windSpeed = 0.00005;
    windSpeedSlider.value = windSpeed;
    windSpeedSliderText.value = windSpeed;
    windPosition = Math.random() * Math.PI * 2;
    windDirection = Math.random() * Math.PI * 2;
    // windPosition = 0;
    // windDirection = 0;
  }
};
