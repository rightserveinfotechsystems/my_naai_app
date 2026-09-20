import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
jest.mock('react-native-safe-area-context', () => ({
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
    SafeAreaProvider: ({ children }) => children,
    SafeAreaView: ({ children, ...rest }) => require('react-native').View,
}));

jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker');
jest.mock('react-native-vector-icons/Ionicons', () =>
    require('react').forwardRef((props, ref) => require('react').createElement(require('react-native').Text, props, props.children))
);

import SalonQueueUpdateTimeModal from '../src/components/SalonQueueUpdateTimeModal';

const booking = {
    bookingId: 'b1',
    userName: 'Test Customer',
    bookingDate: '2099-09-07',
    bookingTime: '18:30:00',
};

function findAncestor(instance, predicate) {
    let node = instance;
    while (node) {
        if (predicate(node)) return node;
        node = node.parent;
    }
    return null;
}

function isTouchable(n) {
    return n.type === 'TouchableOpacity' || n.type?.displayName === 'TouchableOpacity';
}

function createModal() {
    let tree;
    act(() => {
        tree = ReactTestRenderer.create(React.createElement(SalonQueueUpdateTimeModal, {
            booking, open: true, onClose: () => {}, onSubmit: () => {}, saving: false,
        }));
    });
    return tree;
}

function allTexts(tree) {
    return tree.root.findAll(n => n.type === 'Text').map(n => n.children.join(''));
}

function byTestId(tree, id) {
    return tree.root.findAll(n => n.props.testID === id);
}

function fireLayout(node, layout) {
    act(() => { node.props.onLayout({ nativeEvent: { layout } }); });
}

test('quick select: tapping the Shift appointment select opens a dropdown with all options', () => {
    const tree = createModal();
    const label = tree.root.findAll(n => n.type === 'Text' && n.children.join('') === 'Shift appointment')[0];
    const box = findAncestor(label, isTouchable);
    expect(box).toBeTruthy();

    act(() => { box.props.onPress(); });

    const texts = allTexts(tree);
    expect(texts).toContain('Choose time shift');
    expect(texts).toContain('Running late');
    expect(texts).toContain('Free earlier');
    expect(texts).toContain('10 minutes later');
    expect(texts).toContain('20 minutes later');
    expect(texts).toContain('30 minutes later');
    expect(texts).toContain('45 minutes later');
    expect(texts).toContain('1 hour later');
    expect(texts).toContain('1 hour 30 minutes later');
    expect(texts).toContain('30 minutes earlier');
    expect(texts).toContain('20 minutes earlier');
    expect(texts).toContain('15 minutes earlier');
    expect(texts).toContain('10 minutes earlier');
});

test('picking an option updates the select box value and closes the dropdown', () => {
    const tree = createModal();
    const label = tree.root.findAll(n => n.type === 'Text' && n.children.join('') === 'Shift appointment')[0];
    const box = findAncestor(label, isTouchable);
    act(() => { box.props.onPress(); });

    const opt = tree.root.findAll(n => n.type === 'Text' && n.children.join('') === '20 minutes later')[0];
    const optRow = findAncestor(opt, isTouchable);
    act(() => { optRow.props.onPress(); });

    const texts = allTexts(tree);
    expect(texts).toContain('+20m • 20 minutes later');
    expect(texts).not.toContain('Choose time shift'); // dropdown closed
});

test('card is capped to the space left in the sheet (measured via onLayout)', () => {
    const tree = createModal();
    // Simulate native layout: sheet 461pt tall; select box sits 183pt below sheet top.
    fireLayout(byTestId(tree, 'update-time-sheet')[0], { x: 0, y: 351, width: 390, height: 461 });
    fireLayout(byTestId(tree, 'update-time-body')[0], { x: 14, y: 63, width: 362, height: 392 });
    fireLayout(byTestId(tree, 'update-time-offset-section')[0], { x: 0, y: 94, width: 362, height: 130 });
    fireLayout(byTestId(tree, 'update-time-select-wrap')[0], { x: 0, y: 26, width: 362, height: 56 });

    const label = tree.root.findAll(n => n.type === 'Text' && n.children.join('') === 'Shift appointment')[0];
    const box = findAncestor(label, isTouchable);
    act(() => { box.props.onPress(); });

    const card = byTestId(tree, 'update-time-dropdown-card')[0];
    // available = 461 - (63+94+26) - 62 - 8 = 208 → capped card height
    expect(card.props.style).toEqual(expect.arrayContaining([expect.objectContaining({ maxHeight: 208 })]));
});

test('tapping the tap-catcher closes the dropdown', () => {
    const tree = createModal();
    const label = tree.root.findAll(n => n.type === 'Text' && n.children.join('') === 'Shift appointment')[0];
    const box = findAncestor(label, isTouchable);
    act(() => { box.props.onPress(); });
    expect(byTestId(tree, 'update-time-dropdown-card').length).toBeGreaterThan(0);

    const catcher = byTestId(tree, 'update-time-dropdown-tapcatcher')[0];
    act(() => { catcher.props.onPress(); });
    expect(byTestId(tree, 'update-time-dropdown-card')).toHaveLength(0);
});

test('switching to Exact time hides the select and shows the time input', () => {
    const tree = createModal();
    const exact = tree.root.findAll(n => n.type === 'Text' && n.children.join('') === 'Exact time')[0];
    const exactBtn = findAncestor(exact, isTouchable);
    act(() => { exactBtn.props.onPress(); });

    const texts = allTexts(tree);
    expect(texts).not.toContain('Shift appointment');
    expect(texts).toContain('New start time');
});
