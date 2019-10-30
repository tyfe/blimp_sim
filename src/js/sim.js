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

const motorForce = 0.0005 * (1 / 128);
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
  },
});

Render.run(render);

// create runner
const runner = Runner.create();
Runner.run(runner, engine);

world.gravity.y = 0;

// add stiff global constraint
const blimpBase = Bodies.circle(400, 300, blimpRadius, {
  density: 0.001,
  friction: 0.7,
  frictionStatic: 0,
  frictionAir: 0.02,
  restitution: 0.5,
  ground: false,
});

const leftWall = Bodies.rectangle(-10, 300, 60, 610, { isStatic: true });
const rightWall = Bodies.rectangle(810, 300, 60, 610, { isStatic: true });
const topWall = Bodies.rectangle(405, 15, 810, 30, { isStatic: true });
const bottomWall = Bodies.rectangle(405, 585, 810, 30, { isStatic: true });

// const constraint = Constraint.create({
//   pointA: { x: 400, y: 50 },
//   bodyB: body,
//   pointB: { x: 0, y: -10 },
// });

World.add(world, [blimpBase, leftWall, rightWall, topWall, bottomWall]);

// fit the render viewport to the scene
Render.lookAt(render, {
  min: { x: 0, y: 0 },
  max: { x: 800, y: 600 },
});

// const keys = [];

// // add event listener for keyboard control
// document.body.addEventListener('keydown', (e) => {
//   keys[e.keyCode] = true;
// });

// document.body.addEventListener('keyup', (e) => {
//   keys[e.keyCode] = false;
// });

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

Matter.Events.on(engine, 'beforeTick', () => {
  let leftMotorForce = { x: 0, y: 0 };
  let rightMotorForce = { x: 0, y: 0 };

  const { angle } = blimpBase;
  const rightPositionOffset = Matter.Vector.add(blimpBase.position,
    { x: 20 * Math.cos(angle), y: 20 * Math.sin(angle) });
  const leftPositionOffset = Matter.Vector.add(blimpBase.position,
    { x: 20 * Math.cos(angle + Math.PI), y: 20 * Math.sin(angle + Math.PI) });
  leftMotorForce = Matter.Vector.add(leftMotorForce, {
    x: leftMotorLevel * motorForce * Math.cos(angle + Math.PI / 2),
    y: leftMotorLevel * motorForce * Math.sin(angle + Math.PI / 2),
  });
  rightMotorForce = Matter.Vector.add(rightMotorForce, {
    x: rightMotorLevel * motorForce * Math.cos(angle + Math.PI / 2),
    y: rightMotorLevel * motorForce * Math.sin(angle + Math.PI / 2),
  });

  Matter.Body.applyForce(blimpBase, Matter.Vector.add(blimpBase.position, {
    x: blimpRadius * Math.cos(windPosition),
    y: blimpRadius * Math.sin(windPosition),
  }), {
    x: windSpeed * Math.cos(windDirection),
    y: windSpeed * Math.sin(windDirection),
  });
  Matter.Body.applyForce(blimpBase, leftPositionOffset, leftMotorForce);
  Matter.Body.applyForce(blimpBase, rightPositionOffset, rightMotorForce);
});

// setup for remote connection
const socket = new WebSocket('ws://localhost:5005');
const velocityList = [];

socket.onopen = () => {
  console.log('Connection to localhost succeeded');
};

Matter.Events.on(engine, 'afterUpdate', () => {
  if (velocityList.length > 1) {
    velocityList.pop();
  }
  velocityList.push(blimpBase.velocity);
  const sum = velocityList.reduce((a, b) => ({ x: a.x + b.x, y: a.y + b.y }));
  const acceleration = {
    x: sum.x / (timeDelta * velocityList.length),
    y: sum.y / (timeDelta * velocityList.length),
  };

  const message = {
    acceleration,
    angularVelocity: blimpBase.angularVelocity,
    linearVelocity: blimpBase.velocity,
  };

  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
  }

  leftMotorSpeedElement.value = leftMotorLevel;
  rightMotorSpeedElement.value = rightMotorLevel;
});

socket.onmessage = (e) => {
  let { data } = e;
  data = JSON.parse(data);
  const { keysPressed } = data;
  leftMotorLevel = parseInt(data.leftPowerLevel, 10);
  rightMotorLevel = parseInt(data.rightPowerLevel, 10);

  if (keysPressed.includes('r')) {
    windSpeedSlider.value = 0;
    windSpeedSliderText.value = 0;
    windSpeed = 0;
    Matter.Body.setPosition(blimpBase, { x: 400, y: 300 });
    Matter.Body.setVelocity(blimpBase, { x: 0, y: 0 });
    Matter.Body.setAngularVelocity(blimpBase, 0);
    Matter.Body.setAngle(blimpBase, 0);
  }
  if (keysPressed.includes('t')) {
    windSpeed = Math.random() * 0.0001;
    windSpeedSlider.value = windSpeed;
    windSpeedSliderText.value = windSpeed;
    windPosition = Math.random() * Math.PI * 2;
    windDirection = Math.random() * Math.PI * 2;
  }
};
