import 'pixi';
import 'p2';
import Phaser from 'phaser';

export default class Tank extends Phaser.State {
  constructor () {
    super();
    this.power = 300;
    this.targetCount = 5;
    this.tankScore = 0;
  }

  init () {
    this.game.renderer.renderSession.roundPixels = true;
    this.game.world.setBounds(0, 0, 800, 600);
    this.physics.startSystem(Phaser.Physics.ARCADE);
    this.physics.arcade.gravity.y = 200;
  }

  preload () {
    //  We need this because the assets are on Amazon S3
    //  Remove the next 2 lines ifDashboard running locally
    // this.load.baseURL = 'http://files.phaser.io.s3.amazonaws.com/codingtips/issue001/';
    // this.load.crossOrigin = 'anonymous';
    this.load.image('tank', 'assets/tank/tank.png');
    this.load.image('turret', 'assets/tank/turret.png');
    this.load.image('bullet', 'assets/tank/bullet.png');
    this.load.image('background1', 'assets/tank/background2.jpg');
    this.load.image('flame', 'assets/tank/flame.png');
    this.load.image('target', 'assets/tank/target.png');
    this.load.audio('shoot', 'assets/audio/nes-05-03.wav');
    this.load.audio('win', 'assets/Menu/ta-da.wav');
    this.load.audio('boom', 'assets/Menu/explosion.wav');
    this.load.audio('music', 'assets/audio/intensioso.mp3')

  //  Note: Graphics from Amiga Tanx Copyright 1991 Gary Roberts
  }

  create () {
    //  Simple but pretty background
    this.background = this.add.sprite(0, 0, 'background1');
    this.hitSound = this.add.audio('boom');
    this.winSound = this.add.audio('win');
    this.shootSound = this.add.audio('shoot');
    this.music = this.add.audio('music');
    this.music.play();

    //  Something to shoot at :)
    this.targets = this.add.group(this.game.world, 'targets', false, true, Phaser.Physics.ARCADE);
    //  A single bullet that the tank will fire
    this.bullet = this.add.sprite(0, 0, 'bullet');
    this.bullet.exists = false;
    this.physics.arcade.enable(this.bullet);

    //  The body of the tank
    this.tank = this.add.sprite(24, 483, 'tank');
    // this.tank.allowGravity = false;


    //  The turret which we rotate (offset 30x14 from the tank)
    this.turret = this.add.sprite(this.tank.x + 30, this.tank.y + 14, 'turret');

    //  When we shoot this little flame sprite will appear briefly at the end of the turret
    this.flame = this.add.sprite(0, 0, 'flame');
    this.flame.anchor.set(0.5);
    this.flame.visible = false;

    //  Used to display the power of the shot
    this.power = 300;
    this.powerText = this.add.text(8, 8, 'Power: 300', { font: '18px Arial', fill: '#ffffff' });
    this.powerText.setShadow(1, 1, 'rgba(0, 0, 0, 0.8)', 1);
    this.powerText.fixedToCamera = true;

    this.world.scale.setTo(1);


    //  Some basic controls
    this.cursors = this.input.keyboard.createCursorKeys();
    this.escape = this.input.keyboard.addKey(Phaser.Keyboard.ESC);

    this.fireButton = this.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
    this.fireButton.onDown.add(this.fire, this);
    this.pause = this.input.keyboard.addKey(Phaser.Keyboard.P);
    this.unpause = this.input.keyboard.addKey(Phaser.Keyboard.S);
    this.resetGame();
    console.log(this.tankScore);
  }

  fire () {
    this.shootSound.play();
    if (this.bullet.exists) {
      return;
    }
    //  Re-position the bullet where the turret is
    this.bullet.reset(this.turret.x, this.turret.y);
    //  Now work out where the END of the turret is
    var p = new Phaser.Point(this.turret.x, this.turret.y);
    p.rotate(p.x, p.y, this.turret.rotation, false, 34);

    //  And position the flame sprite there
    this.flame.x = p.x;
    this.flame.y = p.y;
    this.flame.alpha = 1;
    this.flame.visible = true;

    //  Boom
    this.add.tween(this.flame).to({ alpha: 0 }, 100, 'Linear', true);

    //  So we can see what's going on when the bullet leaves the screen
    this.camera.follow(this.bullet);

    //  Our launch trajectory is based on the angle of the turret and the power
    this.physics.arcade.velocityFromRotation(this.turret.rotation, this.power, this.bullet.body.velocity);
  }

  hitTarget (bullet, target) {
    target.kill();
    this.hitSound.play();
    this.removeBullet();
    this.targetCount = this.targetCount - 1;
  }

  removeBullet () {
    this.bullet.kill();
    this.camera.follow();
    this.add.tween(this.camera).to({ x: 0 }, 1000, 'Quint', true, 1000);
  }

  goHome () {
    this.state.start('TankGameOver');
    this.resetGame();
    this.music.stop();
  }

  playerUpdate () {
    window.game.tankCompleted();
  }

  resetGame () {
    this.targets.removeAll(true);
    this.targetCount = 5;
    this.targets.create(310, 490, 'target');
    this.targets.create(420, 490, 'target');
    this.targets.create(530, 490, 'target');
    this.targets.create(640, 490, 'target');
    this.targets.create(750, 490, 'target');

    //  Stop gravity from pulling them away
    this.targets.setAll('body.allowGravity', false);
  }

  update () {
    if (this.pause.isDown) {
      this.physics.arcade.isPaused = true;
    }
    if (this.unpause.isDown) {
      this.physics.arcade.isPaused = false;
    }
    if (this.escape.isDown) {
      this.goHome();
    } else if (this.targetCount > 0) {
      if (this.bullet.exists) {
        if (this.bullet.y > 540) {
          //  Simple check to see if it's fallen too low
          this.removeBullet();
        } else {
          //  Bullet vs. the Targets
          this.physics.arcade.overlap(this.bullet, this.targets, this.hitTarget, null, this);
        }
      } else {
        //  Allow them to set the power between 100 and 600
        if (this.cursors.left.isDown && this.power > 100) {
          this.power -= 2;
        } else if (this.cursors.right.isDown && this.power < 600) {
          this.power += 2;
        }

        if (this.cursors.up.isDown && this.turret.angle > -90) {
          this.turret.angle--;
        } else if (this.cursors.down.isDown && this.turret.angle < 0) {
          this.turret.angle++;
        }

        //  Update the text
        this.powerText.text = 'Power: ' + this.power;
      }
    } else {
      this.state.start('TankWin');
      this.playerUpdate();
      this.winSound.play();
      this.music.stop();
      console.log(this.tankScore);
    }
  }
}
