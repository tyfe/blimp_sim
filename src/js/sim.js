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

const motorForce = 0.000125 * (1 / 127);
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
const blimpBase = Bodies.circle(400, 300, blimpRadius, {
  density: 0.001,
  friction: 0.7,
  frictionStatic: 0,
  frictionAir: 0.02,
  restitution: 1,
  ground: false,
});

Matter.Body.setAngle(blimpBase, Math.PI / -2);

const leftWall = Bodies.rectangle(-10, 300, 60, 610, { isStatic: true });
const rightWall = Bodies.rectangle(810, 300, 60, 610, { isStatic: true });
const topWall = Bodies.rectangle(405, 15, 810, 30, { isStatic: true });
const bottomWall = Bodies.rectangle(405, 585, 810, 30, { isStatic: true });

World.add(world, [blimpBase, leftWall, rightWall, topWall, bottomWall]);

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

const drawVectors = () => {
  const { canvas } = render;
  const { angle } = blimpBase;
  const ctx = canvas.getContext('2d');
  const windForceVector = {
    x: windSpeed * Math.cos(windDirection),
    y: windSpeed * Math.sin(windDirection),
  };
  const windAppPoint = Matter.Vector.add(blimpBase.position, {
    x: blimpRadius * Math.cos(windPosition),
    y: blimpRadius * Math.sin(windPosition),
  });

  ctx.lineWidth = 1;
  ctx.strokeStyle = '#00ffff';
  ctx.beginPath();

  ctx.moveTo(blimpBase.position.x, blimpBase.position.y);
  ctx.lineTo(blimpBase.position.x + 100 * blimpBase.velocity.x,
    blimpBase.position.y + 100 * blimpBase.velocity.y);

  ctx.stroke();

  ctx.strokeStyle = '#ff00ff';
  if (blimpBase.leftMotorForce) {
    const position = Matter.Vector.add(blimpBase.position,
      { x: 20 * Math.cos(angle + Math.PI / 2), y: 20 * Math.sin(angle + Math.PI / 2) });
    ctx.beginPath();
    ctx.moveTo(position.x, position.y);
    ctx.lineTo(position.x + 120000 * blimpBase.leftMotorForce.x,
      position.y + 120000 * blimpBase.leftMotorForce.y);
    ctx.stroke();
  }
  if (blimpBase.rightMotorForce) {
    const position = Matter.Vector.add(blimpBase.position,
      { x: 20 * Math.cos(angle - Math.PI / 2), y: 20 * Math.sin(angle - Math.PI / 2) });
    ctx.beginPath();
    ctx.moveTo(position.x, position.y);
    ctx.lineTo(position.x + 120000 * blimpBase.rightMotorForce.x,
      position.y + 120000 * blimpBase.rightMotorForce.y);
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.moveTo(windAppPoint.x, windAppPoint.y);
  ctx.lineTo(windAppPoint.x + 1200000 * windForceVector.x,
    windAppPoint.y + 1200000 * windForceVector.y);
  ctx.stroke();
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

  Matter.Body.applyForce(blimpBase, Matter.Vector.add(blimpBase.position, {
    x: blimpRadius * Math.cos(windPosition),
    y: blimpRadius * Math.sin(windPosition),
  }), {
    x: windSpeed * Math.cos(windDirection),
    y: windSpeed * Math.sin(windDirection),
  });
  Matter.Body.applyForce(blimpBase, leftPositionOffset, leftMotorForce);
  Matter.Body.applyForce(blimpBase, rightPositionOffset, rightMotorForce);

  blimpBase.leftMotorForce = leftMotorForce;
  blimpBase.rightMotorForce = rightMotorForce;
});

// setup for remote connection
const socket = new WebSocket('ws://localhost:5005');

socket.onopen = () => {
  console.log('Connection to localhost succeeded');
};

const lastVelocity = [blimpBase.velocity];

Matter.Events.on(engine, 'afterUpdate', () => {
  let deltaV = Matter.Vector.sub(blimpBase.velocity, lastVelocity[0]);
  lastVelocity.push(Matter.Vector.clone(blimpBase.velocity));
  if (lastVelocity.length > 5) {
    lastVelocity.shift();
  }

  // console.log(blimpBase.velocity, lastVelocity[0]);

  // rotate velocity so that it is relative to the coordinate frame of the blimp
  const relativeVelocity = Matter.Vector.rotate(blimpBase.velocity, blimpBase.angle);
  deltaV = Matter.Vector.rotate(deltaV, blimpBase.angle);

  const acceleration = {
    x: (deltaV.x * 1000) / (timeDelta * lastVelocity.length),
    y: (deltaV.y * 1000) / (timeDelta * lastVelocity.length),
  };


  // determine if blimp is close to a wall
  const blimpPosition = blimpBase.position;
  const closeToWall = (blimpPosition.x > 700 || blimpPosition.x < 100)
    || (blimpPosition.y > 500 || blimpPosition.y < 100);

  const message = {
    acceleration,
    angularVelocity: blimpBase.angularVelocity,
    linearVelocity: relativeVelocity,
    closeToWall,
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
    windSpeed = 0.000025;
    windSpeedSlider.value = windSpeed;
    windSpeedSliderText.value = windSpeed;
    windPosition = Math.random() * Math.PI * 2;
    windDirection = Math.random() * Math.PI * 2;
  }
};
