import * as d3 from "./d3.v7.js";

function render({ model, el }) {
  let container = document.createElement("div");
  container.setAttribute("id", "drawhere");

  // This is the HTML that we want to render. This is done via JS because we can't rely too much
  // on HTML attributes in a notebook environment. 
  // <fieldset style="width: 200px; margin: 10px; display:inline">
  //   <legend>Class:</legend>
  //   <input type="radio" id="radio_a" checked/>
  //   <label for="a">a</label>
  //   <input type="radio" id="radio_b"/>
  //   <label for="b">b</label>
  //   <input type="radio" id="radio_c"/>
  //   <label for="c">c</label>
  //   <input type="radio" id="radio_d"/>
  //   <label for="d">d</label>
  // </fieldset>
  // <fieldset style="width: 200px; margin: 10px; display:inline">
  //   <legend>Brushsize:</legend>
  //   <input type='range' id='size' name='size' min='5' max='100' value='10' style="display:inline"/>
  // </fieldset>                     
  // <button id="reset" style="display:inline">Reset</button>
  // <button id="undo" style="display:inline">Undo</button>
  // <p style="display:inline">
  //   a: <span id="count_a">0</span>
  //   b: <span id="count_b">0</span>
  //   c: <span id="count_c">0</span>
  //   d: <span id="count_d">0</span>
  // </p>

  console.log("data on load", model.get("data"));
  let fieldset_radio = document.createElement("fieldset");
  fieldset_radio.setAttribute("style", "width: 200px; margin: 10px; display:inline");
  
  let legend_radio = document.createElement("legend");
  legend_radio.innerText = "Class:";  
  fieldset_radio.appendChild(legend_radio);

  // Add radio buttons to the fieldset
  let radio_buttons = {};
  
  function add_label_elem(parent, id){
    let label = document.createElement("label");
    label.setAttribute("for", id);
    label.innerText = id;
    parent.appendChild(label);
  }

  ["a", "b", "c", "d"].map(function(d, i){
    let radio = document.createElement("input");
    radio.setAttribute("type", "radio");  
    radio.setAttribute("name", "colorselector")
    radio.setAttribute("value", i);
    if (i == 0){
      radio.setAttribute("checked", "true");
      radio.click()
    }
    add_label_elem(fieldset_radio, d);
    radio.onclick = function(){
      selected_color = colors[i];
    }
    radio_buttons[d] = radio;
    fieldset_radio.appendChild(radio);
  });

  container.appendChild(fieldset_radio);

  let fieldset_size = document.createElement("fieldset");
  fieldset_size.setAttribute("style", "width: 200px; margin: 10px; display:inline");

  let legend_size = document.createElement("legend");
  legend_size.innerText = "Brushsize:";
  fieldset_size.appendChild(legend_size);

  console.log("brushsize", model.get("brushsize"))
  console.log("data", model.get("data"))

  let size_input = document.createElement("input");
  size_input.setAttribute("type", "range");
  size_input.setAttribute("id", "size");
  size_input.setAttribute("name", "size");
  size_input.setAttribute("min", "5");
  size_input.setAttribute("max", "100");
  size_input.setAttribute("value", model.get("brushsize"));
  size_input.setAttribute("style", "display:inline");
  size_input.onchange = resize_brush;
  size_input.oninput = resize_brush;

  fieldset_size.appendChild(size_input);
  container.appendChild(fieldset_size);

  let reset_btn = document.createElement("button");
  reset_btn.setAttribute("id", "reset");
  reset_btn.setAttribute("style", "display:inline");
  reset_btn.innerText = "Reset";
  reset_btn.onclick = reset;
  container.appendChild(reset_btn);

  let undo_btn = document.createElement("button");
  undo_btn.setAttribute("id", "undo");
  undo_btn.setAttribute("style", "display:inline");
  undo_btn.innerText = "Undo";
  undo_btn.onclick = undo;
  container.appendChild(undo_btn);

  let div = document.createElement("div");
  div.setAttribute("style", "display:inline; padding-left: 50px;");
  
  let count_spans = {};
  ["a", "b", "c", "d"].map(function(d, i){
    let span = document.createElement("span");
    span.innerText = `${d}: 0`;
    span.setAttribute("style", "padding-right: 2px; padding-left: 2px")
    count_spans[d] = span;
    div.appendChild(span);
  });

  container.appendChild(div);
  el.appendChild(container);


  const colors = ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728"];
  const height = 500;
  const width = 800;

  let data = model.get("data").map(function(d){
    d['y'] = height - d['y']; 
    return d
  });
  let svg = d3.select(container).append("svg").style("display", "block");
  let selected_color = colors[0];
  let batch = 0;

  svg
    .attr("width", width)
    .attr("height", height)
    .style("background", "#eeeeee")
    .call(
      d3.drag().on("start", drag_start).on("drag", dragged).on("end", drag_end)
    )
    .on("mousemove", mousemove);

  function redraw_from_scratch(){
    svg.selectAll("circle.drawn").remove();

    data.map(function(d){
      svg
          .append("circle")
          .attr("cx", d.x)
          .attr("cy", d.y)
          .attr("r", 4)
          .style("fill", d.color)
          .attr("class", `batch_${d.batch} drawn`);
    });
  }

  redraw_from_scratch();
  model.on("change:data", redraw_from_scratch)
  model.on("change:brushsize", function(){ 
    console.log("brushsize changed")
    circle_brush.attr("r", size_input.value)
  })

  let circle_brush = svg
    .append("circle")
    .attr("cx", width / 2)
    .attr("cy", height / 2)
    .attr("r", model.get("brushsize"))
    .style("fill-opacity", 0.1);

  function drag_start(event) {
    // You could restart the browser and the HTML may remember the
    // checked state without the JS knowing about it. Hence this check.
    ["a", "b", "c", "d"].map(function (d, i) {
      if (radio_buttons[d].checked) {
        selected_color = colors[i];
      }
    });
  }

  function mousemove(event) {
    // The brush needs to move along with the mouse
    let rect = svg.node().getBoundingClientRect();
    circle_brush
      .attr("cx", event.pageX - rect["x"] + "px")
      .attr("cy", event.pageY - rect["top"] + "px");
  }

  function resize_brush() {
    // We want the paintbrush to show the size param, hence this update
    model.set("brushsize", size_input.value);
  }

  function dragged(event) {
    // Add new datapoints to the screen, but not to the datastore just yet
    let r1 = container.getBoundingClientRect();
    let r2 = svg.node().getBoundingClientRect();
    let size = size_input.value;
    let new_x = event.x + (Math.random() - 0.5) * size;
    let corrected_y = event.y - (r2.y - r1.y);
    let new_y = corrected_y + (Math.random() - 0.5) * size;
    svg
      .append("circle")
      .attr("cx", new_x)
      .attr("cy", new_y)
      .attr("r", 4)
      .style("fill", selected_color)
      .attr("class", `batch_${batch} drawn`);
    data.push({ x: new_x, y: new_y, color: selected_color, batch: batch });
    circle_brush.attr("cx", event.x + "px").attr("cy", corrected_y + "px");
  }

  function drag_end(event) {
    // The `model.save_changes` method might be depending on what we've
    // drawn, so we only run it once dragging is done. Saves bunch of compute!
    model.set("data", grab_data());
    model.save_changes();
    batch = Math.max(...data.map(function(d){return d.batch }), 0 ) + 1;
    update_counts();
  }

  function grab_data() {
    // We need to account for the fact that we draw the y-axis other way around in svg land
    return data.map(function(d){return { x: d.x, y: height - d.y, color: d.color }});
  }

  function reset() {
    data = [];
    model.set("data", []);
    svg.selectAll("circle.drawn").remove();
    update_counts();
  }

  function undo(){
    let batch = Math.max(...data.map(function(d){return d.batch }), 0 );
    d3.selectAll(`circle.batch_${batch}`).remove();
    data = data.filter(function(d){return d.batch != batch});
    model.set("data", grab_data());
    model.save_changes();
    update_counts();
  }

  function update_counts(){
    ["a", "b", "c", "d"].map(function(d, i){
      let count = data.filter(function(d){return d.color == colors[i]}).length;
      count_spans[d].innerText = `${d}: ${count}`
    })
  }

  return () => {
    d3.select(container).remove();
  }
}

export default { render };
