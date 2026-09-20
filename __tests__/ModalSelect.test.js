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

function createModal(props = {}) {
    let tree;
    act(() => {
        tree = ReactTestRenderer.create(React.createElement(SalonQueueUpdateTimeModal, {
            booking, open: true, onClose: () => {}, onSubmit: () => {}, saving: false,
            ...props,
        }));
    });
    return tree;
}

function allTexts(tree) {
    return tree.root.findAll(n => n.type === 'Text').map(n => n.children.join(''));
}

function touchableForText(tree, text) {
    const node = tree.root.findAll(n => n.type === 'Text' && n.children.join('') === text)[0];
    return findAncestor(node, isTouchable);
}

test('quick select shows every Running late and Free earlier option at once (no hidden dropdown)', () => {
    const tree = createModal();

    const texts = allTexts(tree);
    expect(texts).toContain('Running late');
    expect(texts).toContain('Free earlier');
    expect(texts).toContain('10 min later');
    expect(texts).toContain('20 min later');
    expect(texts).toContain('30 min later');
    expect(texts).toContain('45 min later');
    expect(texts).toContain('60 min later');
    expect(texts).toContain('90 min later');
    expect(texts).toContain('10 min earlier');
    expect(texts).toContain('15 min earlier');
    expect(texts).toContain('20 min earlier');
    expect(texts).toContain('30 min earlier');
});

test('picking a later chip highlights it, shows the summary and preview', () => {
    const tree = createModal();

    const chip = touchableForText(tree, '20 min later');
    act(() => { chip.props.onPress(); });

    // chip is highlighted in gold
    expect(chip.props.style).toEqual(expect.arrayContaining([expect.objectContaining({ backgroundColor: '#E8B97E' })]));

    const texts = allTexts(tree);
    expect(texts).toContain('+20m'); // summary pill
    expect(texts.some(t => t.includes('20 minutes later'))).toBe(true); // preview
    expect(texts.some(t => t.includes('06:30 pm → 06:50 pm'))).toBe(true);
});

test('picking an earlier chip works too and shows the earlier preview', () => {
    const tree = createModal();

    const chip = touchableForText(tree, '15 min earlier');
    act(() => { chip.props.onPress(); });

    // chip is highlighted in green
    expect(chip.props.style).toEqual(expect.arrayContaining([expect.objectContaining({ backgroundColor: '#6ED19E' })]));

    const texts = allTexts(tree);
    expect(texts).toContain('-15m'); // summary pill
    expect(texts.some(t => t.includes('15 minutes earlier'))).toBe(true);
    expect(texts.some(t => t.includes('06:30 pm → 06:15 pm'))).toBe(true);
});

test('custom minutes input drives the preview and invalid values show an error', () => {
    const tree = createModal();

    const input = tree.root.findAll(n => n.props.placeholder === 'e.g. 25 or -15')[0];
    act(() => { input.props.onChangeText('25'); });

    let texts = allTexts(tree);
    expect(texts).toContain('+25m');
    expect(texts.some(t => t.includes('25 minutes later'))).toBe(true);

    act(() => { input.props.onChangeText('500'); });
    texts = allTexts(tree);
    expect(texts).toContain('Enter -120 to +240, not 0');
});

test('submit stays disabled until a valid selection, then submits the chosen offset', () => {
    const onSubmit = jest.fn();
    const tree = createModal({ onSubmit });

    const submit = touchableForText(tree, 'Update & notify');
    expect(submit.props.disabled).toBe(true);

    const chip = touchableForText(tree, '20 min later');
    act(() => { chip.props.onPress(); });

    expect(submit.props.disabled).toBe(false);
    act(() => { submit.props.onPress(); });
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0].preview.offsetMinutes).toBe(20);
});

test('switching to Exact time hides the quick options and shows the time input', () => {
    const tree = createModal();
    const exactBtn = touchableForText(tree, 'Exact time');
    act(() => { exactBtn.props.onPress(); });

    const texts = allTexts(tree);
    expect(texts).not.toContain('Running late');
    expect(texts).not.toContain('Free earlier');
    expect(texts).toContain('New start time');
});
