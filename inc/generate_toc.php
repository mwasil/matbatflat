<?php
function createSlug($text) {
    $text = strtolower($text);
    $text = str_replace(
        ['ą', 'ć', 'ę', 'ł', 'ń', 'ó', 'ś', 'ź', 'ż', 'Ą', 'Ć', 'Ę', 'Ł', 'Ń', 'Ó', 'Ś', 'Ź', 'Ż'],
        ['a', 'c', 'e', 'l', 'n', 'o', 's', 'z', 'z', 'a', 'c', 'e', 'l', 'n', 'o', 's', 'z', 'z'],
        $text
    );
    $text = preg_replace('/[^\w\s]/', '', $text);
    $text = preg_replace('/\s+/', '_', $text);
    return $text;
}

function addIdsToHeadings($content) {
    return preg_replace_callback(
        '/<h([12])>(.*?)<\/h[12]>/i',
        function($matches) {
            $tag = $matches[1];
            $content = trim($matches[2]);
            $id = createSlug($content);
            return "<h{$tag} id=\"{$id}\">{$content}</h{$tag}>";
        },
        $content
    );
}
?>
