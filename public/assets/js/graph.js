document.querySelector( `#query-btn` ).addEventListener( `click`, () => {
  fetch( `/graph?cypher=${document.querySelector( `#cypher-query` ).value}` )
    .then( res => res.json() )
    .then( data => {
      const svg = d3.select(`svg`),
            width = window.innerWidth,
            height = window.innerHeight;
      
      // Clear SVG stage from previous query (if any)
      svg.selectAll( `*` ).remove();

      // Create d3.js simulation with several forces
      const simulation = d3.forceSimulation( data.nodes )
        .force( `link`, d3.forceLink( data.links ).id( d => d.id ).distance( 150 ) )
        .force( `charge`, d3.forceManyBody().strength( -500 ) )
        .force( `center`, d3.forceCenter( width / 2, height / 2 ) )
        .force( `collide`, d3.forceCollide( 60 ) );

      // Create relationships (edges)
      const link = svg.append( `g` )
        .selectAll( `line` )
        .data( data.links )
        .join( `line` )
        .attr( `class`, d => d.type )
        .attr( `stroke-width`, 2 );

      // Create nodes (vertices)
      const node = svg.append( `g` )
        .selectAll( `circle` )
        .data( data.nodes )
        .join( `circle` )
        .attr( `r`, d =>{
          // Attempt to size node by links to node
          const conn = data.links.filter(
            l => l.source == d.id || l.target == d.id).length;
            //cap at 20 connections so it doesn't get too large
            return Math.max(10, Math.min(30, conn));
        } )
        .attr('class', d => d.label )
        .on("click", (event, d) => {
          alert(JSON.stringify(d.properties, null , 2))
        })
        .call( drag( simulation ) );

      // Add labels to nodes
      const label = svg.append( `g` )
        .selectAll( `text` )
        .data( data.nodes )
        .join( `text` )
        .text( d => d.properties.title || d.properties.name || d.label)
        .attr( `dx`, 25 )
        .attr( `dy`, `.35em` );

      // Position relationship and node elements
      simulation.on( `tick`, () => {
        link
          .attr( `x1`, d => d.source.x )
          .attr( `y1`, d => d.source.y )
          .attr( `x2`, d => d.target.x )
          .attr( `y2`, d => d.target.y );

        node
          .attr( `cx`, d => d.x )
          .attr( `cy`, d => d.y );

        label
          .attr( `x`, d => d.x )
          .attr( `y`, d => d.y );
      });

      // Handle node click-n-drag
      function drag( simulation ) {
        return d3.drag()
          .on( `start`, event => {
            if ( !event.active ) simulation.alphaTarget( 0.3 ).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
          })
          .on( `drag`, event => {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
          })
          .on( `end`, event => {
            if (!event.active) simulation.alphaTarget( 0 );
            event.subject.fx = null;
            event.subject.fy = null;
          });
      }
    });
});


document.querySelector( `#cypher-query` ).addEventListener( `keyup`, event => {
  if ( event.key === `Enter` ) {
    document.querySelector( `#query-btn` ).click();
  }
});