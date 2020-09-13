const assert = require('assert');
const Forest = require('./forest');
const Combinatorics = require('js-combinatorics');

describe('test Forest', function() {

  it('should result in one root, independent of insertion order', function() {
    const edges = ['ab', 'bc', 'ad', 'ea'];
    const permutations = Combinatorics.permutation(edges);

    console.log(`testing ${permutations.length} permutations of insertions`);
    permutations.forEach(order => {
      const forest = new Forest();
      order.forEach(edge => forest.add(edge[0], edge[1]));
      assert(Object.keys(forest.roots).length == 1);
    });
  });

  it('should support multiple roots until united', function() {
    const forest = new Forest();
    forest.add('a', 'b');
    forest.add('c', 'd');
    assert(Object.keys(forest.roots).length == 2);
    forest.add('e', 'a');
    forest.add('e', 'c');
    assert(Object.keys(forest.roots).length == 1);
  });


  it('should ignore an already existing edge', function() {
    const forest = new Forest();
    forest.add('a', 'b');
    forest.add('b', 'c');
    forest.add('b', 'c');
    assert(Object.keys(forest.nodes).length == 3);
  });

  it('support nodes with multiple parents, without duplicating them', function() {
    const forest = new Forest();
    forest.add('a', 'b');
    forest.add('c', 'b');
    forest.add('b', 'd');
    assert(Object.keys(forest.roots).length == 2);
    assert(Object.keys(forest.nodes).length == 4);
  });
});
