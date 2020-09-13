
/** a forest class */
class Forest {
  roots = {}; // aka trees
  nodes = {};

  /** Add an edge to the forest. Will connect trees as necessary. */
  add(parentName, childName) {
    let parentNode = this.nodes[parentName];
    let childNode = this.nodes[childName];
    let changed = false;

    if (!childNode) {
      childNode = {name: childName, children: {}};
      this.nodes[childName] = childNode;
      changed = true;
    }

    if (!parentNode) {
      // it must be a new root
      parentNode = {name: parentName, children: {}};
      this.nodes[parentName] = parentNode;
      this.roots[parentName] = parentNode;
      changed = true;
    }

    if (!parentNode.children[childName]) {
      parentNode.children[childName] = childNode;
      changed = true;
    }

    // if the child has been a root until now, remove it
    delete this.roots[childName];

    return changed;
  }

  getNumberOfRoots() {
    return Object.keys(this.roots).length;
  }
}

module.exports = Forest;
