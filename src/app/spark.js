/**
 * Spark constructor
 */
function Spark(type) {
  this.name = '';
  this.type = type;
  this.color = this.getColorFromType(this.type);
  this.img = this.getImageFromType(this.type);

  this.wrapper = $('<div/>')
    .addClass('grid-shape-gem-spark')
    .css({ backgroundImage: this.img });
}

Spark.prototype = {
  constructor: Spark,

  /**
   * Get image URL based on spark type
   *
   * @param type    Spark type
   */
  getImageFromType: function(type) {
    var img = 'none';

    switch (type) {
      case 'power': img = 'url("img/spark_flatPower.png")'; break;
      case 'haste': img = 'url("img/spark_flatHaste.png")'; break;
      case 'health':  img = 'url("img/spark_flatHealth.png")'; break;
    }

    return img;
  },

  /**
   * Get spark color based on type
   *
   * @param type    Spark type
   */
  getColorFromType: function(type) {
    var color = 'none';

    switch (type) {
      case 'power': color = 'green'; break;
      case 'haste': color = 'blue'; break;
      case 'health':  color = 'red'; break;
    }

    return color;
  }
}

export default Spark;
