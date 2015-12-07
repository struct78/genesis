function Genesis(container) {
    this.container = container;
    this.chart = {};
    this.csv = {};
    this.legend = {};
    this.svg = {};
    this.tooltip = {};
    this.data = {};
    this.defaultData = {};
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
        this.tooltip = d3.select(this.container).append("div").attr("class", "tooltip").style("opacity", 0);
        this.svg = this.chart.append("svg")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");
        this.load();
    },
    load: function() {
        var parent = this;
        d3.csv(this.csv, function(error, data) {
            if (error) {
                console.log("Error");
            } else {
                // Temporary
                data = data.filter(function(d) {
                    return d.year > 1950;
                    //return d.year > 1500 && d.word.length>10;
                });

                data = data.sort(function(a, b) {
                    // Sort by Word Type, then Word
                    ///return d3.ascending(a.year, b.year);
                    //return d3.ascending(parent.colour(a), parent.colour(b));
                });

                var nest = d3.nest()
                    .key(function(d) { return d.year; })
                    .entries(data);


                parent.data = parent.defaultData = nest;
                parent.createAxes();
                parent.buildChart();
            }
        });
    },
    createAxes: function() {
        var parent = this;


        // X AXIS
        this.values.x = function(d) {
            return d.key;
        };
        this.extents.x = d3.extent(this.data, this.values.x);
        this.scale.x = d3.scale.linear().domain([this.extents.x[0], 2015]).rangeRound([0, this.width]);

        if (this.nice) {
            this.scale.x = this.scale.x.nice();
        }

        this.map.x = function(d) {
            return parent.scale.x(parent.values.x(d));
        };
        this.axis.x = d3.svg.axis().scale(this.scale.x).orient("top").tickFormat(d3.format("d")).ticks(51).tickSize(5);




        // Y AXIS
        var max = d3.max(this.data, function(d) {
            return d.values.length;
        });
        this.values.y = function(d) {
            return d.values;
        };

        this.extents.y = [0, max + 1];
        this.scale.y = d3.scale.linear().domain(this.extents.y).rangeRound([0, this.height]);
        this.map.y = function(d) {
            console.log(d);
            return parent.scale.y(parent.values.y(d));
        };
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
/*
        this.svg
            .selectAll(".y .tick text")
            .attr("dx", '2.2em')
            .attr("dy", '1.1em')
            .attr("text-anchor", "start")
            .attr("transform", "rotate(-90)");

        // y-axis
        
        this.svg.append("g")
            .attr("class", "y axis")
            .attr("transform", "translate(0,0)")
            .call(this.axis.y)
            .append("text")
            .attr("class", "label")
            .attr("x", -this.height / 2)
            .attr("y", -30)
            .attr("transform", "rotate(-90)")
            .attr("text-anchor", "middle")
            .text("Year");*/

        x = d3.scale.ordinal().rangeRoundBands([0, this.width], 0.05);
        y = d3.scale.ordinal().rangeRoundBands([0, this.height], 0.05);
        x.domain(this.data.map(this.values.x));
        y.domain(this.data.map(this.values.y));

    },

    buildChart: function() {
        var parent = this;

        var years = this.svg
            .selectAll(".year")
            .data(this.data);

        years
            .enter()
            .append("g")
            .attr("class", "year")
            .attr("transform", function(d) { return "translate(" + parent.scale.x(d.key) + ",0)"; })
            .attr("x", this.map.x)
            .attr("y", 1);

        var rectangles = years
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
                return parent.colour(d.word_type);
            })
            .attr("x", 0)
            .transition()
            .delay(function(d,i) {
                return i*0.75;
            })
            .attr("y", this.map.y)
            .duration(this.transitionTime)
            .attr("transform", function(d) {
                return "translate(1,1)"; //" + y.rangeBand() * 1.8 + "
            })
            .attr("width", x.rangeBand())
            .attr("height", y.rangeBand());

        rectangles.on("mouseover", function(d) {
                //d3.select(this).transition().duration(900).ease('elastic').attr('r', 10);
                parent.tooltip.transition()
                    .duration(200)
                    .style("opacity", 0.95);

                var table = 
                        "<table class=\"tooltip-table\"><tr><td>Word</td>" +
                        "<td><strong>" + d.parent + "</strong></td></tr>";

                        if (d.word != d.parent) {
                            table += "<tr><td>Variation</td>" +
                            "<td><strong>" + d.word + "</strong></td></tr>";
                        }

                    table += "<tr><td>Year</td>" +
                        "<td><strong>" + d.year + "</strong></td></tr>" +
                        "<tr><td>Word Type</td>" +
                        "<td><strong>" + d.word_type + "</strong></td></tr>" +
                        "</table>";

                parent.tooltip.html(table)
                    .style("left", (d3.event.pageX) + "px")
                    .style("top", (d3.event.pageY - 130) + "px")
                    .style("background-color", parent.colour(d.word_type));
            })
            .on("mouseout", function(d) {
                //d3.select(this).transition().duration(500).ease('elastic').attr('r', 5);
                parent.tooltip.transition()
                    .duration(200)
                    .style("opacity", 0);
            });

        rectangles.exit().remove();
    },
    shuffle: function(o) {
        for (var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
        return o;
    },
    resize: function(w) {
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
            .delay(function(d,i) {
                return i*0.1;
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

    },
    filter: function(text) {
        this.data = this.defaultData.filter(function(d) {
            var re = new RegExp(text);
            if (re.exec(d.word)) {
                return true;
            }
            return false;
        });
        
        this.buildChart();
    }
};

$(function() {
    var genesis = new Genesis('#genesis');
    //genesis.colours = ["#EB3503", "#9C2B9F", "#F7AC23", "#2CA2CE", "#F17013"];
    //genesis.colours = ["#1BE7FF", "#6EEB83", "#E4FF1A", "#FFB800", "#FF5714"];
    //genesis.colours = ["#E4FF1A", "#FFF908", "#1BBBFF", "#FF2A20", "#50FF57"];
    genesis.colours = ["#676666", "#F3E61E", "#ED217C", "#DAD7CD", "#07A0C3", "#811A68", "#DF320F", "#FF6B35", "#F05AC0", "#26547C", "#7B287D", "#F5EFED"];
    genesis.colours = genesis.shuffle(genesis.colours);
    genesis.legend = '#legend';
    genesis.margin = {
        top: 70,
        left: 0,
        right: 0,
        bottom: 20
    };
    genesis.csv = 'data/words.csv';
    genesis.transitionTime = 1500;
    genesis.init();

    $('#search').on('keyup', function() {
        var text = $(this).val();
        genesis.filter(text);
    });
});
