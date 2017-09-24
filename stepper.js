/**
 * ����������� ������� stepper
 * @constructor
 * @param {object} pins - ������ �� ���������� step, direction, enable ���� Pin
 * @param {Object} opts - ������ �� ���������� pps (��������) � holdPower (pwm)
 */
var Stepper = function(pins, opts) {
  this._pins = pins;
  opts = opts || {};

  this._pps = opts.pps || 20;
  this._holdPower = opts.holdPower || 0;

  this._pins.step.mode('output');
  this._pins.enable.mode('output');
  this._pins.direction.mode('output');

  this.hold();

  this._intervalId = null;
};

/**
 * ���������� ��� ������ ������� �� ���������
 * @param {float} power - ���������� ��� �� 0 �� 1
 */
Stepper.prototype.hold = function(power) {
  
  if (this._intervalId !== null) {
    clearInterval(this._intervalId);
    this._intervalId = null;
  }

  if (typeof(power) === 'undefined') {
    power = this._holdPower;
  }

  analogWrite(this._pins.enable, power);
};
/**
 * ������������� ��� �� step �����, ����� ���� ��������� callback.
 * @param {number} steps - ���������� �����. ��� ������������� �������� ���������� �������� �����
 * @param {function} callback - �������, ����������� ����� ��������� ����
 */
Stepper.prototype.rotate = function(steps, callback) {
  this.hold(1);

  if (steps === undefined) {
    steps = 1;
  }

  if (steps < 0) {
    this._pins.direction.write(1);
    steps *= -1;
  } else {
    this._pins.direction.write(0);
  }

  var self = this;
  this._intervalId = setInterval(function() {
    if (steps > 0){
      digitalPulse(self._pins.step, 1, 1);
      steps--;
    } else {
      self.hold();
      if (callback) {
        callback();
      }
    }
  }, 1000 / this._pps);
};

/**
 * ���������� ���������� ����� � �������
 */
Stepper.prototype.pps = function(pps) {
  if (pps === undefined) return this._pps;
  this._pps = pps;
  return this;
};

/**
 * ����������������� �������� ��������� ���� �������� ��� �������������
 */
Stepper.prototype.holdPower = function(holdPower) {
  if (holdPower === undefined) return this._holdPower;
  this._holdPower = holdPower;
  return this;
};

/**
 * ������� ������� �������� ������� Stepper
 * @param {object} pins - ������ �� ���������� step, direction, enable ���� Pin
 * @param {Object} opts - ������ �� ���������� pps (��������) � holdPower (pwm)
 */
exports.connect = function(pins, opts) {
  return new Stepper(pins, opts);
};