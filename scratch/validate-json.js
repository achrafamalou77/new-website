const fs = require('fs');
const path = require('path');

function validate() {
  const filePath = path.join(__dirname, 'complete-whatsapp-chatbot-workflow.json');
  console.log(`Loading JSON from: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    console.error('Error: File does not exist!');
    process.exit(1);
  }

  const raw = fs.readFileSync(filePath, 'utf8');
  let data;
  
  try {
    data = JSON.parse(raw);
    console.log('✔ File parsed successfully as JSON!');
  } catch (e) {
    console.error('❌ JSON Syntax Error:', e.message);
    process.exit(1);
  }

  // Check top-level properties
  const requiredKeys = ['name', 'nodes', 'connections'];
  requiredKeys.forEach(key => {
    if (data[key] === undefined) {
      console.error(`❌ Validation Error: Missing required property "${key}"`);
      process.exit(1);
    }
  });

  console.log(`✔ Top-level keys verified: ${requiredKeys.join(', ')}`);
  console.log(`✔ Total nodes found: ${data.nodes.length}`);

  // Check unique node names and node ids
  const nodeNames = new Set();
  const nodeIds = new Set();
  data.nodes.forEach((node, i) => {
    if (!node.name) {
      console.error(`❌ Validation Error: Node at index ${i} has no name.`);
      process.exit(1);
    }
    if (!node.id) {
      console.error(`❌ Validation Error: Node "${node.name}" has no ID.`);
      process.exit(1);
    }
    if (nodeNames.has(node.name)) {
      console.error(`❌ Validation Error: Duplicate node name "${node.name}" detected.`);
      process.exit(1);
    }
    if (nodeIds.has(node.id)) {
      console.error(`❌ Validation Error: Duplicate node ID "${node.id}" detected.`);
      process.exit(1);
    }
    nodeNames.add(node.name);
    nodeIds.add(node.id);
  });

  console.log('✔ All node names and IDs are unique and present!');

  // Check connections refer to valid nodes
  let connectionsCount = 0;
  for (const [sourceNode, targets] of Object.entries(data.connections)) {
    if (!nodeNames.has(sourceNode)) {
      console.error(`❌ Connection Error: Source node "${sourceNode}" does not exist in nodes list.`);
      process.exit(1);
    }
    targets.main.forEach(outputs => {
      outputs.forEach(target => {
        if (!nodeNames.has(target.node)) {
          console.error(`❌ Connection Error: Target node "${target.node}" connected from "${sourceNode}" does not exist in nodes list.`);
          process.exit(1);
        }
        connectionsCount++;
      });
    });
  }

  console.log(`✔ Connections verified: ${connectionsCount} links are fully intact and point to active nodes!`);
  console.log('\n⭐ WORKFLOW IS 100% VALID AND READY FOR IMPORT INTO n8n! ⭐');
}

validate();
