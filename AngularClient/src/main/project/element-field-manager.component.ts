import { moveItemInArray } from "@angular/cdk/drag-drop";
import { SelectionModel } from "@angular/cdk/collections";
import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from "@angular/core";
import { MatDialog, MatTable } from "@angular/material";
import { Element, ElementField, ElementFieldDataType, Project, ProjectService } from "@forcrowd/backbone-client-core";
import { finalize } from "rxjs/operators";

import { RemoveConfirmComponent } from "./remove-confirm.component";

@Component({
  selector: "element-field-manager",
  templateUrl: "element-field-manager.component.html",
  styleUrls: ["element-field-manager.component.css"]
})
export class ElementFieldManagerComponent implements OnInit {

  @Input() project: Project = null;
  @Input() projectOwner: boolean = null;
  @Output() isEditingChanged = new EventEmitter<boolean>();
  @ViewChild(MatTable) matTable: MatTable<any>;

  selection = new SelectionModel<ElementField>(true, []);
  elementFieldDisplayedColumns = ["select", "element", "name", "dataType", "createdOn"];
  elementFieldDataType = ElementFieldDataType;
  selectedElementList: Element[] = [];

  get selectedElementField(): ElementField {
    return this.fields.selectedElementField;
  }
  set selectedElementField(value: ElementField) {
    if (this.fields.selectedElementField !== value) {
      this.fields.selectedElementField = value;

      // Prepare selected element list
      if (this.selectedElementField) {
        this.selectedElementList = this.project.ElementSet
          .filter(element => element !== this.selectedElementField.Element // Exclude element field's parent element
            && element.ParentFieldSet.length === 0); // and elements that are already selected
      }

      this.isEditingChanged.emit(value ? true : false);
    }
  }

  get elementFilter(): Element {
    return this.fields.elementFilter;
  }
  set elementFilter(value: Element) {
    if (this.fields.elementFilter !== value) {
      this.fields.elementFilter = value;

      if (value) {
        value.ElementFieldSet.sort((a, b) => a.SortOrder - b.SortOrder);
      }
    }
  }

  private fields: {
    selectedElementField: ElementField,
    elementFilter: Element,
  } = {
      selectedElementField: null,
      elementFilter: null,
    }

  get isBusy(): boolean {
    return this.projectService.isBusy;
  }

  constructor(private projectService: ProjectService,
    private dialog: MatDialog) { }

  addElementField(): void {
    this.selectedElementField = this.projectService.createElementField({
      Element: this.elementFilter,
      Name: "New field",
      DataType: ElementFieldDataType.String
    });
  }

  cancelElementField(): void {
    var elementField = this.selectedElementField;
    this.selectedElementField = null;
    this.projectService.rejectChangesElementField(elementField);
  }

  editElementField(elementField: ElementField): void {
    this.selectedElementField = elementField;
  }

  ngOnInit(): void {
    this.elementFilter = this.project.ElementSet[0];
    if (!this.projectOwner) this.elementFieldDisplayedColumns.splice(0, 1);
  }

  onListDrop($event) {

    if (!this.elementFilter) {
      return;
    }

    // Update data & render
    const prevIndex = this.elementFilter.ElementFieldSet.findIndex(d => d === $event.item.data);
    moveItemInArray(this.elementFilter.ElementFieldSet, prevIndex, $event.currentIndex);
    this.matTable.renderRows();

    // Update elements' SortOrder property
    this.elementFilter.ElementFieldSet.map((e, i) => {
      if (e.SortOrder !== i) {
        e.SortOrder = i;
      }
    });

    // Save
    this.projectService.saveChanges().subscribe();
  }

  removeElementField(): void {
    const dialogRef = this.dialog.open(RemoveConfirmComponent);
    dialogRef.afterClosed().subscribe(confirmed => {

      if (!confirmed) return;

      if (this.selection.selected.length > 0) {
        this.selection.selected.forEach(elementField => {
          this.projectService.removeElementField(elementField);
        });
        this.projectService.saveChanges().pipe(
          finalize(() => {
            this.matTable.renderRows();
            this.selection.clear();
          })).subscribe();
      }
    });
  }

  saveElementField(): void {
    this.selectedElementField.SortOrder = this.selectedElementField.Element.ElementFieldSet.length;
    this.projectService.saveElementField(this.selectedElementField)
      .subscribe(() => {
        this.selectedElementField = null;
      });
  }

  submitDisabled(): boolean {

    var hasValidationErrors = this.selectedElementField.entityAspect.getValidationErrors().length > 0
      || (this.selectedElementField.DataType === ElementFieldDataType.Element && !this.selectedElementField.SelectedElement);

    return this.isBusy || hasValidationErrors;
  }

  isAllSelected() {

    if (!this.elementFilter)
      return false;

    const numSelected = this.selection.selected.length;
    const numRows = this.elementFilter.ElementFieldSet.length;
    return numSelected === numRows;
  }

  masterToggle() {

    if (!this.elementFilter)
      return;

    this.isAllSelected() ?
        this.selection.clear() :
        this.elementFilter.ElementFieldSet.forEach(row => this.selection.select(row));
  }

  trackBy(index: number, elementField: ElementField) {
    return elementField.Id;
  }
}
