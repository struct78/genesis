// TODO
// Make 5 blocks per row?
// Fix tween in and out for blocks when filtering
//


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
    FILTER: 'filter',
    ROTATE: 'rotate'
};

var Rotation = { 
    PORTRAIT: 'portrait',
    LANDSCAPE: 'landscape'
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
    this.rotation = Rotation.LANDSCAPE;
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
    this.margin = {
        top: 0,
        left: 0,
        bottom: 0,
        right: 0
    };

    this.typemap = {};
}

Genesis.prototype = {
    init: function() {
        this.chart = d3.select(this.container);
        this.contextWidth = $(this.context).width();
        this.contextHeight = $(this.context).height();
        this.context = d3.select(this.context);
        this.width = $(this.container).width() - this.margin.left - this.margin.right;
        this.height = $(this.container).height() - this.margin.top - this.margin.bottom;
        this.legend = d3.select(this.legend);
        this.tooltip = d3.tip().attr('class', 'd3-tip').html(function(d) {
            return d;
        });
        this.tooltip.offset([-10, 0]);
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

/*
                console.log(d3.map(data, function(d) {
                    return d.word_type;
                }).keys().sort(function(a,b) {
                    return d3.ascending(a,b);
                }));*/

                // Filter out any entry before 1500
                data = data.filter(function(d) {
                    return d.year > 1500;
                    //return d.year > 1850 && d.year < 1950;
                });

                console.log(data.length + " filtered entries");

                // Colourise & sort here instead of after nest

                var nest = d3.nest()
                    .key(function(d) {
                        return d.year;
                    })
                    .entries(data);

                nest = this.index(nest);
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
    index: function(data) {
        data.forEach(function(d, i) {
            d.values.forEach(function(a, b) {
                a.index = b;
                a.sortOrder = 0;

                for (var key in this.typemap) {
                    for (var x = 0 ; x < this.typemap[key].values.length; x++ ) {
                        var value = this.typemap[key].values[x];
                         if (value.toLowerCase()===a.word_type.toLowerCase()) {
                            a.sortOrder = +this.typemap[key].sortOrder;
                            return;
                        }
                    }
                }
            }.bind(this));


            d.values.sort(function(a, b) {
                // Sort by Word Type, then Word
                return d3.ascending(a.sortOrder, b.sortOrder);
            });
        }.bind(this));

        return data;
    },
    createValues: function() {
        this.values.x = function(d) {
            if (this.rotation == Rotation.LANDSCAPE) {
                return +d.key;
            }
            return d.index;
        }.bind(this);

        this.values.y = function(d) {
            if (this.rotation == Rotation.LANDSCAPE) {
                return d.index;
            }

            return +d.key;
        }.bind(this);

        this.values.x2 = this.values.x;
        this.values.y2 = this.values.y;
    },
    createExtents: function() {
        if (this.rotation == Rotation.LANDSCAPE) {
            this.extents.x = d3.extent(this.data, this.values.x);
            this.extents.y = [0, d3.max(this.data, function(d) {
                return d.values.length;
            })];
        }
        else {
            this.extents.x = [0, d3.max(this.data, function(d) {
                return d.values.length;
            })];
            this.extents.y = d3.extent(this.data, this.values.y);
        }

        this.extents.x2 = this.extents.x;
        this.extents.y2 = this.extents.y;
    },
    createScale: function() {
        this.scale.x = d3.scale.linear().domain(this.extents.x).range([0, this.width]);
        this.scale.y = d3.scale.linear().domain(this.extents.y).range([0, this.height]);

        // Context
        this.scale.x2 = this.scale.x;
        this.scale.y2 = this.scale.y;

        if (this.nice) {
            this.scale.x = this.scale.x.nice();
            this.scale.y = this.scale.y.nice();

            this.scale.x2 = this.scale.x2.nice();
            this.scale.y2 = this.scale.y2.nice();
        }
    },
    createMap: function() {
        this.map.x = function(d) {
            return this.scale.x(this.values.x(d));
        }.bind(this);

        this.map.y = function(d) {
            return this.scale.y(this.values.y(d));
        }.bind(this);

        // Context
        this.map.x2 = this.map.x;
        this.map.y2 = this.map.y;
    },
    setup: function() {
        this.createValues();
        this.createExtents();
        this.createScale();
        this.createMap();

        // Context
        this.createBrush();
    },
    createBrush: function() {

    },
    createAxes: function() {
        this.setup();

        if (this.rotation == Rotation.LANDSCAPE) {
            this.axis.x = d3.svg.axis().scale(this.scale.x).orient("top").tickFormat(d3.format("d")).ticks(51).tickSize(5);
            this.axis.y = d3.svg.axis().scale(this.scale.y).orient("left").ticks(10).tickSize(3);
        }
        else {
            this.axis.x =  d3.svg.axis().scale(this.scale.x).orient("top").ticks(10).tickSize(3);
            this.axis.y = d3.svg.axis().scale(this.scale.y).orient("left").tickFormat(d3.format("d")).ticks(51).tickSize(5);
        }


        // Focus
        if (this.rotation == Rotation.LANDSCAPE) {
            this.svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0,0)")
                .call(this.axis.x);

            this.svg.selectAll(".x text")
                .attr("text-anchor", "start")
                .attr("y", '0.27em')
                .attr("x", '2.5em')
                .attr("transform", "rotate(-90)");
        }
        else {
            this.svg.append("g")
                .attr("class", "y axis")
                .attr("transform", "translate(0,0)")
                .call(this.axis.y);

            this.svg.selectAll(".y text")
                .attr("text-anchor", "start")
                .attr("y", '1.25em')
                .attr("x", '3.5em');
        }


        // Context
        this.axis.x2 = this.axis.x;
        this.axis.y2 = this.axis.y;
    },
    buildChart: function() {
        this.triggerEvent(GenesisEvent.RENDER_START);

        // Focus
        x = d3.scale.ordinal().domain(d3.range(this.extents.x[0], this.extents.x[1])).rangeBands([0, this.width], 0.15);
        y = d3.scale.ordinal().domain(d3.range(0, this.extents.y[1])).rangeBands([0, this.height], 0.15);
    
        if (this.rotation == Rotation.PORTRAIT) {
            x = d3.scale.ordinal().domain(d3.range(0, this.extents.x[1])).rangeBands([0, this.width], 0.15);
            y = d3.scale.ordinal().domain(d3.range(this.extents.y[0], this.extents.y[1])).rangeBands([0, this.height], 0.15);
        }

        //this.svg.selectAll("*").remove();

        var years = this.svg
            .selectAll(".year")
            .data(this.data);

        years
            .enter()
            .append("g")
            .attr("class", "year")
            .attr("transform", function(d) {
                if (this.rotation == Rotation.LANDSCAPE) {
                    return "translate(" + this.scale.x(d.key) + ", 1) scale(1,0)";
                }
                return "translate(1, " + this.scale.y(d.key) + ") scale(0,1)";
            }.bind(this));


        if (this.rotation == Rotation.LANDSCAPE) {
            years
                .attr("x", this.map.x)
                .attr("y", 1);
        }
        else {
            years
                .attr("x", 1)
                .attr("y", this.map.y);
        }

        var rectangles = years
            .selectAll(".word")
            .data(function(d) {
                return d.values;
            });


        years
            .exit()
            .remove();

        rectangles
            .exit()
            .transition()
            .duration(this.transitionTime)
            .attr("height", 0)
            .remove();


        rectangles
            .enter()
            .append("rect")
            .attr("class", "word")
            .attr("x", 0);

        rectangles
            .style("fill", function(d) {
                // Change colour to nouns/verbs/adverbs/adjectives/etc
                return this.colour(d.word_type);
            }.bind(this));

        if (this.rotation == Rotation.LANDSCAPE) {
            rectangles
                .attr("y", this.map.y.bind(this));
        }
        else {
            rectangles
                .attr("x", this.map.x.bind(this));
        }

        rectangles
                .attr("transform", function(d) {
                    return "translate(0,0)"; //" + y.rangeBand() * 1.8 + "
                })
                .attr("height", y.rangeBand())
                .attr("width", x.rangeBand());

        rectangles
            .on('mouseover', function(d) {
                //var p = new Parallel(rectangles);
                //p.spawn(this.tasks.opacity);
/*
                rectangles
                    .attr('opacity', function(a, i) {
                        if (a.parent == d.parent || a==d) {
                            return 1;
                        }
                        return 0.2;
                    })
                    .attr('transform', function(a, i) {
                        if (a.parent == d.parent || a==d) {
                            return "scale(2, 2)";
                        }
                        return "scale(1,1)";
                    });*/

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
                    "<tr><td>Sort Order</td>" +
                    "<td><strong style=\"color:" + this.colour(d.word_type) + "\">" + d.sortOrder + "</strong></td></tr>" +
                    "</table>";


                this.tooltip.html(caption);
                this.tooltip.show(d.word);
            }.bind(this))
            .on('mouseout', function(d) {
                this.tooltip.hide();
                years.attr('opacity', 1);
            }.bind(this));


        years.transition()
            .duration(this.transitionTime)
            .delay(function(d, i) {
                return i * this.delayTime;
            }.bind(this))
            .attr("transform", function(d) {
                if (this.rotation == Rotation.LANDSCAPE) {
                    return "translate(" + this.scale.x(d.key) + ", 1) scale(1,1)";
                }
                return "translate(1, " + this.scale.y(d.key) + ") scale(1,1)";
            }.bind(this)).call(this.endall, function() {
                this.triggerEvent(GenesisEvent.RENDER_END);
            }.bind(this));
/*
                .transition()
                .duration(this.transitionTime)
                .delay(function(d, i) {
                    return i * this.delayTime;
                }.bind(this))*/

        // Context

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
        var clone = $.extend(true, [], this.defaults.data);

        if (text !== "") {
            clone.forEach(function(d) {
                d.values = d.values.filter(function(e) {
                    var re = new RegExp("^" + text, "gi");
                    if (re.exec(e.word)) {
                        return true;
                    }
                    return false;
                });
            });

            this.data = this.index(clone);
        } else {
            this.data = clone;
        }

        //this.svg.selectAll(".year").remove();
        this.setup();
        this.buildChart();
    },
    colour: function(word_type) {
        var colour = this.typemap.OTHER.colour;

        for (var key in this.typemap) {
            /*jshint loopfunc:true */
            var br = false;
            this.typemap[key].values.forEach(function(value) {
                if (value.toLowerCase()===word_type.toLowerCase()) {
                    colour = this.typemap[key].colour;
                    br = true;
                }
            }.bind(this));

            if (br) {
                break;
            }
        }

        return colour;
    },
    switchAxes: function() {
        if (this.rotation == Rotation.LANDSCAPE) {
            this.rotation = Rotation.PORTRAIT;
        }
        else {
            this.rotation = Rotation.LANDSCAPE;
        }

        this.width = this.height;
        this.height = this.width;
        this.createAxes();
        this.triggerEvent(GenesisEvent.ROTATE, { rotation: this.rotation, width: this.width, height: this.height });
    },
    tasks: {
        opacity: function(a, i) {
            if (a.parent == d.parent || a==d) {
                return 1;
            }
            return 0.2;
        }
    }
};

var genesis = new Genesis('#genesis');

$(function() {
    //["#07A0C3", "#26547C", "#F5EFED", "#FF6B35", "#F3E61E", "#DF320F", "#811A68", "#F05AC0", "#DAD7CD", "#ED217C", "#676666", "#7B287D"]
    //["#DF320F", "#811A68", "#FF6B35", "#F5EFED", "#F05AC0", "#676666", "#DAD7CD", "#F3E61E", "#26547C", "#ED217C", "#7B287D", "#07A0C3"]
    //["#F05AC0", "#07A0C3", "#F3E61E", "#DAD7CD", "#DF320F", "#ED217C", "#7B287D", "#FF6B35", "#676666", "#F5EFED", "#26547C", "#811A68"]

    genesis.typemap = {
        ADVERB: {
            colour: '#676666',
            values: ['adverb'],
            sortOrder: 6
        },
        ADJECTIVE: {
            colour: '#DF320F',
            values: ['adjective'],
            sortOrder: 3,
        },
        CONJUNCTION: {
            colour: '#F3E61E',
            values: ['conjunction'],
            sortOrder: 11
        },
        DEFINITE_ARTICLE: {
            colour: '#DF320F',
            values: ['definite article'],
            sortOrder: 10
        },
        INDEFINITE_ARTICLE: {
            colour: '#811A68',
            values: ['indefinite article'],
            sortOrder: 9
        },
        INTERJECTION: {
            colour: '#ff6b35',
            values: ['interjection'],
            sortOrder: 8
        },
        NOUN: {
            colour: '#ff6b35',
            values: [
                'noun', 
                'noun plural', 
                'noun plural but singular in construction', 
                'noun plural but singular or plural in construction',
                'noun plural but usually singular in construction', 
                'noun singular but plural in construction',
                'noun singular but singular or plural in construction',
                'noun, often cap N&J&S',
                'noun, plural',
                'noun, plural in construction',
                'noun, singular or plural in construction'
            ],
            sortOrder: 1
        },
        VERB: {
            colour: '#f3e61e',
            values: [
                'verb',
                'verb imperative',
                'verb impersonal',
                'verb past',
                'verbal auxiliary'
            ],
            sortOrder: 2
        },
        PREPOSITION: {
            colour: '#F5EFED',
            values: ['preposition'],
            sortOrder: 7
        },
        MULTIPLE: {
            colour: '#FF6B35',
            values: [
                'adjective or adverb',
                'adjective or noun',
                'adjective or noun or pronoun',
                'adverb or adjective', 
                'adverb or conjunction', 
                'adverb or conjunction or preposition', 
                'adverb or preposition', 
                'conjunction or preposition', 
                'noun or adjective', 
                'noun or intransitive verb', 
                'noun or transitive verb',
                'pronoun or adjective',
            ],
            sortOrder: 5
        },
        OTHER: {
            colour: '#676666',
            values: [
                ''
            ],
            sortOrder: 4
        }
    };
    /*
    genesis.colours = ['#07A0C3', '#26547C', '#F5EFED', '#FF6B35', '#F3E61E', '#DF320F', '#811A68', '#F05AC0', '#DAD7CD', '#ED217C', '#676666', '#7B287D'];
    genesis.colours = d3.shuffle(genesis.colours);*/
    genesis.margin = {
        top: 40,
        left: 0,
        right: 0,
        bottom: 20
    };
    genesis.strokeWidth = 1;
    genesis.context = '#context';
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
    genesis.on('rotation', function(e) {
        console.log(e.rotation);
        $('body').addClass(e.rotation);
        $('#genesis').height(e.height);
        $('#genesis').width(e.width);
    });

    genesis.init();
    //genesis.switchAxes();
    //console.log(genesis.rotation);

    $('#search').on('keyup', function() {
        var text = $(this).val();
        delay(function() {
            genesis.filter(text);
        }, 500);
    });
});
