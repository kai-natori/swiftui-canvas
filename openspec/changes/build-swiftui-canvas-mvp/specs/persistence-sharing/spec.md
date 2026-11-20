# Spec Delta — persistence-sharing

## ADDED Requirements

### Requirement: No-backend persistence
The editor SHALL autosave the document to localStorage on every change
and restore it on load. The user SHALL be able to save the document as a
JSON file (named from its title) and open such a file back into the
editor. No account or server SHALL be involved.

### Requirement: Share links
A share action SHALL produce a URL whose hash carries the whole document
(`#sc=` + base64url of deflate-raw-compressed JSON). Opening such a URL
SHALL load the document through tolerant ingress and surface any repair
warnings to the user.

#### Scenario: Sharing a design
- **WHEN** the user copies a share link and a second person opens it in
  a fresh browser
- **THEN** the same design appears on their canvas without any sign-in
