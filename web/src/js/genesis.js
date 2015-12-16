// Console fallback for older browsers
if (typeof console === "undefined") {
    window.console = {};
    window.console.log = function(msg) {
        this.message = msg;
    };
}

// Event Types
var GenesisEvent = {
    DATA: 'data',
    DATA_PROGRESS: 'dataprogress',
    RENDER_START: 'renderstart',
    RENDER_END: 'renderend',
    RESIZE: 'resize',
    FILTER: 'filter'
};

// Delay function for KEYUP events
var delay = (function() {
    var timer = 0;
    return function(callback, ms) {
        clearTimeout(timer);
        timer = setTimeout(callback, ms);
    };
})();

// Genesis constructor
function Genesis(container) {
    this.events = [];
    this.container = container;
    this.chart = {};
    this.csv = {};
    this.legend = {};
    this.svg = {};
    this.tooltip = {};
    this.data = {};
    this.defaults = {
        data: {}
    };
    this.delayTime = 10;
    this.transitionTime = 1000;
    this.nice = false;
    this.extents = {
        x: null,
        y: null
    };
    this.scale = {
        x: null,
        y: null
    };
    this.map = {
        x: null,
        y: null
    };
    this.axis = {
        x: null,
        y: null
    };
    this.values = {
        x: null,
        y: null
    };
    this.colours = null;
    this.colour = null;
    this.margin = {
        top: 0,
        left: 0,
        bottom: 0,
        right: 0
    };
}

Genesis.prototype = {
    init: function() {
        this.chart = d3.select(this.container);
        this.width = $(this.container).width() - this.margin.left - this.margin.right;
        this.height = $(this.container).height() - this.margin.top - this.margin.bottom;
        this.legend = d3.select(this.legend);
        this.colour = d3.scale.ordinal().range(this.colours);
        this.tooltip = d3.tip().attr('class', 'd3-tip').html(function(d) {
            return d;
        });
        this.tooltip.offset([-13, 0]);
        this.svg = this.chart.append("svg")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");
        this.svg.call(this.tooltip);
        this.load();
    },
    on: function(e, fn) {
        this.events.push({
            event: e,
            callback: fn
        });
    },
    triggerEvent: function(e, d) {
        this.events.forEach(function(i) {
            if (i.event === e) {
                console.log("EVENT: " + i.event);
                i.callback(d);
            }
        });
    },
    load: function() {
        d3.csv(this.csv, function(error, data) {
            if (error) {
                console.log("Error loading " + this.csv);
                console.log(error);
            } else {
                this.triggerEvent(GenesisEvent.DATA);

                console.log(data.length + " loaded entries");

                // Filter out any entry before 1500
                data = data.filter(function(d) {
                    return d.year > 1500;
                });

                console.log(data.length + " filtered entries");

                var nest = d3.nest()
                    .key(function(d) {
                        return d.year;
                    })
                    .entries(data);

                nest = this.indexSort(nest);
                this.data = this.defaults.data = nest;
                this.createAxes();
                this.buildChart();
            }
        }.bind(this)).on("progress", function(e) {
            e.onprogress = function(e) {
                this.triggerEvent(GenesisEvent.DATA_PROGRESS, e);
            }.bind(this);
        }.bind(this));
    },
    indexSort: function(nest) {
        nest.forEach(function(d, i) {
            d.values.forEach(function(a, b) {
                a.index = +b + 1;
                a.obsolescence = +a.obsolescence;
            });

            d.values.sort(function(a, b) {
                // Sort by Word Type, then Word
                return d3.ascending(a.word_type, b.word_type);
            });
        });

        return nest;
    },
    createValues: function() {
        this.values.x = function(d) {
            return +d.key;
        };
        this.values.y = function(d) {
            return d.index;
        };
    },
    createExtents: function() {
        this.extents.x = d3.extent(this.data, this.values.x);
        this.extents.y = [0, d3.max(this.data, function(d) {
            return d.values.length;
        })];
    },
    createScale: function() {
        this.scale.x = d3.scale.linear().domain(this.extents.x).range([0, this.width]);
        this.scale.y = d3.scale.linear().domain(this.extents.y).range([0, this.height]);

        if (this.nice) {
            this.scale.x = this.scale.x.nice();
            this.scale.y = this.scale.y.nice();
        }
    },
    createMap: function() {
        this.map.x = function(d) {
            return this.scale.x(this.values.x(d));
        }.bind(this);

        this.map.y = function(d) {
            return this.scale.y(this.values.y(d));
        }.bind(this);
    },
    setup: function() {
        this.createValues();
        this.createExtents();
        this.createScale();
        this.createMap();
    },
    createAxes: function() {
        this.setup();
        this.axis.x = d3.svg.axis().scale(this.scale.x).orient("top").tickFormat(d3.format("d")).ticks(51).tickSize(5);
        this.axis.y = d3.svg.axis().scale(this.scale.y).orient("left").ticks(10).tickSize(3);

        // x-axis
        this.svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0,0)")
            .call(this.axis.x);

        this.svg.selectAll(".x text")
            .attr("text-anchor", "start")
            .attr("y", '0.27em')
            .attr("x", '2.5em')
            .attr("transform", "rotate(-90)");
    },
    buildChart: function() {
        this.triggerEvent(GenesisEvent.RENDER_START);

        x = d3.scale.ordinal().domain(d3.range(this.extents.x[0], this.extents.x[1])).rangeBands([0, this.width], 0.15);
        y = d3.scale.ordinal().domain(d3.range(0, this.extents.y[1])).rangeBands([0, this.height], 0.15);

        //this.svg.selectAll("*").remove();

        var years = this.svg
            .selectAll(".year")
            .data(this.data);

        var rectangles = years
            .enter()
            .append("g")
            .attr("class", "year")
            .attr("transform", function(d) {
                return "translate(" + this.scale.x(d.key) + ", 1) scale(1,0)";
            }.bind(this))
            .attr("x", this.map.x)
            .attr("y", 1)
            .selectAll(".word")
            .data(function(d) {
                return d.values;
            });

        rectangles
            .enter()
            .append("rect")
            .attr("class", "word")
            .style("fill", function(d) {
                // Change colour to nouns/verbs/adverbs/adjectives/etc
                return this.colour(d.word_type);
            }.bind(this))
            .attr("x", 0)
            .attr("y", this.map.y.bind(this))
            .attr("transform", function(d) {
                return "translate(0,0)"; //" + y.rangeBand() * 1.8 + "
            })
            .attr("width", x.rangeBand())
            .attr("height", y.rangeBand())
            .on('mouseover', function(d) {
                var caption =
                    "<h4>" + d.year + "</h4>" +
                    "<table><tr><td>Word</td>" +
                    "<td><strong style=\"color:" + this.colour(d.word_type) + "\">" + d.parent + "</strong></td></tr>";

                if (d.word != d.parent) {
                    caption += "<tr><td>Variation</td>" +
                        "<td><strong style=\"color:" + this.colour(d.word_type) + "\">" + d.word + "</strong></td></tr>";
                }

                caption += "<tr><td>Year</td>" +
                    "<td><strong style=\"color:" + this.colour(d.word_type) + "\">" + d.year + "</strong></td></tr>" +
                    "<tr><td>Type</td>" +
                    "<td><strong style=\"color:" + this.colour(d.word_type) + "\">" + d.word_type + "</strong></td></tr>" +
                    "</table>";


                this.tooltip.html(caption);
                this.tooltip.show(d.word);
            }.bind(this))
            .on('mouseout', this.tooltip.hide);

        rectangles = years
            .selectAll(".word")
            .data(function(d) {
                return d.values;
            });


        years.transition()
            .delay(function(d, i) {
                return i * this.delayTime;
            }.bind(this))
            .duration(this.transitionTime)
            .attr("transform", function(d) {
                return "translate(" + this.scale.x(d.key) + ", 1) scale(1,1)";
            }.bind(this)).call(this.endall, function() {
                this.triggerEvent(GenesisEvent.RENDER_END);
            }.bind(this));

    },
    endall: function(transition, callback) {
        if (transition.size() === 0) {
            callback();
        }

        var n = 0;
        transition
            .each(function() {
                ++n;
            })
            .each("end", function(d, i) {
                if (!--n) {
                    callback.apply(this, arguments);
                }
            });

    },
    resize: function(w) {
        /*
        var parent = this;

        this.originalWidth = this.width;
        this.width = w;
        this.scale.x.range([0, this.width]);

        $(this.container).width(this.width);

        this.chart.select("svg")
            .transition()
            .duration(this.transitionTime)
            .attr("width", this.width);

        x = d3.scale.ordinal().rangeRoundBands([0, this.width], 0.15);
        x.domain(this.data.map(this.values.x));

        var rectangles = this.svg.selectAll(".word");


        rectangles
            .transition()
            .delay(function(d, i) {
                return i * 0.1;
            })
            .duration(this.transitionTime)
            .attr("x", function(d) {
                return parent.map.x(d);
            })
            .attr("width", x.rangeBand());

        this.svg.select(".x")
            .transition()
            .duration(this.transitionTime)
            .call(this.axis.x);
    */
    },
    filter: function(text) {
        var filtered = this.defaults.data.slice();
        filtered.forEach(function(d) {
            d.values = d.values.filter(function(e) {
                var re = new RegExp("^" + text, "gi");
                if (re.exec(e.word)) {
                    return true;
                }
                return false;
            });
        });

        this.svg.selectAll(".year").remove();
        this.data = this.indexSort(filtered);
        this.setup();
        this.buildChart();
    }
};

var genesis = new Genesis('#genesis');

$(function() {
    //["#07A0C3", "#26547C", "#F5EFED", "#FF6B35", "#F3E61E", "#DF320F", "#811A68", "#F05AC0", "#DAD7CD", "#ED217C", "#676666", "#7B287D"]
    //["#DF320F", "#811A68", "#FF6B35", "#F5EFED", "#F05AC0", "#676666", "#DAD7CD", "#F3E61E", "#26547C", "#ED217C", "#7B287D", "#07A0C3"]
    //["#F05AC0", "#07A0C3", "#F3E61E", "#DAD7CD", "#DF320F", "#ED217C", "#7B287D", "#FF6B35", "#676666", "#F5EFED", "#26547C", "#811A68"]
    genesis.colours = ["#07A0C3", "#26547C", "#F5EFED", "#FF6B35", "#F3E61E", "#DF320F", "#811A68", "#F05AC0", "#DAD7CD", "#ED217C", "#676666", "#7B287D"];
    genesis.colours = d3.shuffle(genesis.colours);
    genesis.legend = '#legend';
    genesis.margin = {
        top: 70,
        left: 0,
        right: 0,
        bottom: 20
    };
    genesis.strokeWidth = 1;
    genesis.csv = 'data/words.csv';
    genesis.transitionTime = 100;
    genesis.delayTime = 10;
    genesis.on('renderstart', function() {
        $('.loader').fadeOut(2000);
    });
    genesis.on('dataprogress', function(e) {
        $('.loader .progress').css({
            width: 100 * (e.loaded / e.total) + '%'
        });
    });

    genesis.init();

    $('#search').on('keyup', function() {
        var text = $(this).val();
        delay(function() {
            genesis.filter(text);
        }, 500);
    });
});
