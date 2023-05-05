import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Product } from '../../models/product';
import { NgForm } from '@angular/forms';

@Component({
    selector: 'app-product-detail',
    templateUrl: './product-detail.component.html',
    styleUrls: ['./product-detail.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetailComponent {
    @Input()
    product!: Product;

    @Input()
    detailTitle!: string;

    @Output()
    create = new EventEmitter<Product>();

    @Output()
    update = new EventEmitter<Product>();

    @Output()
    delete = new EventEmitter<Product>();

    @Output()
    close = new EventEmitter<void>();

    submit(form: NgForm) {
        const newProduct: Product = {
            ...this.product,
            ...form.value,
        };

        if (newProduct.id) {
            this.update.emit(newProduct);
        } else {
            this.create.emit(newProduct);
        }
    }
}
